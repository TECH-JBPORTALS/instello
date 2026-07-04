import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const BatchNamingConventionSchema = vv.union(
	vv.literal("numeric"),
	vv.literal("alphabetic"),
);

export type BatchNamingConvention = Infer<typeof BatchNamingConventionSchema>;

export const BatchDtoSchema = vv.object({
	_id: vv.id("classBatches"),
	classId: vv.id("classes"),
	numIdx: vv.number(),
	label: vv.string(),
});

export type BatchDto = Infer<typeof BatchDtoSchema>;

/**
 * Computes the display label for a batch.
 * "numeric" -> "Batch 1", "Batch 2", ...
 * "alphabetic" -> "A", "B", ... "Z", then "A01", "B01", ... "Z01", "A02", ...
 */
export function getBatchLabel(
	numIdx: number,
	convention: BatchNamingConvention = "numeric",
): string {
	if (convention === "numeric") return `B${numIdx.toString().padStart(2, "0")}`;

	const cycle = Math.floor((numIdx - 1) / 26);
	const letter = String.fromCharCode(65 + ((numIdx - 1) % 26));
	return cycle === 0 ? letter : `${letter}${String(cycle).padStart(2, "0")}`;
}

function toDto(
	batch: Doc<"classBatches">,
	convention: BatchNamingConvention,
): BatchDto {
	return {
		_id: batch._id,
		classId: batch.classId,
		numIdx: batch.numIdx,
		label: getBatchLabel(batch.numIdx, convention),
	};
}

export async function listByClass(
	ctx: AppQueryCtx,
	classId: Id<"classes">,
	convention: BatchNamingConvention = "numeric",
): Promise<BatchDto[]> {
	const batches = await ctx.db
		.query("classBatches")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.collect();

	return batches
		.sort((a, b) => a.numIdx - b.numIdx)
		.map((batch) => toDto(batch, convention));
}

export async function getById(ctx: AppQueryCtx, id: Id<"classBatches">) {
	return await ctx.db.get("classBatches", id);
}

/** Verifies a batch belongs to the given class. */
export async function ensureInClass(
	ctx: AppQueryCtx | AppMutationCtx,
	batchId: Id<"classBatches">,
	classId: Id<"classes">,
) {
	const batch = await getById(ctx, batchId);

	if (!batch || batch.classId !== classId) {
		throwAppError(ERROR_CODES.BATCH.NOT_FOUND);
	}

	return batch;
}

async function countStudentsInBatch(
	ctx: AppQueryCtx | AppMutationCtx,
	args: { classId: Id<"classes">; batchId: Id<"classBatches"> },
) {
	const students = await ctx.db
		.query("students")
		.withIndex("by_class_and_batch", (q) =>
			q.eq("classId", args.classId).eq("batchId", args.batchId),
		)
		.collect();

	return students.length;
}

/** Picks the batch in a class with the fewest students currently assigned. */
export async function pickLeastPopulatedBatch(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
) {
	const batches = await ctx.db
		.query("classBatches")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.collect();

	let leastBatch: Doc<"classBatches"> | null = null;
	let leastCount = Number.POSITIVE_INFINITY;

	for (const batch of batches) {
		const count = await countStudentsInBatch(ctx, {
			classId,
			batchId: batch._id,
		});
		if (count < leastCount) {
			leastCount = count;
			leastBatch = batch;
		}
	}

	return leastBatch;
}

/**
 * Sets a student's class and batch assignment. `students.batchId` is the sole
 * record of batch membership, so this always verifies the batch belongs to
 * the target class before writing it.
 */
export async function setBatch(
	ctx: AppMutationCtx,
	args: {
		studentId: Id<"students">;
		classId: Id<"classes">;
		batchId: Id<"classBatches">;
	},
) {
	await ensureInClass(ctx, args.batchId, args.classId);

	await ctx.db.patch("students", args.studentId, {
		classId: args.classId,
		batchId: args.batchId,
		updatedAt: Date.now(),
	});
}

/** Moves a student into a class and clears any batch assignment. */
export async function clearBatch(
	ctx: AppMutationCtx,
	args: { studentId: Id<"students">; classId: Id<"classes"> },
) {
	await ctx.db.patch("students", args.studentId, {
		classId: args.classId,
		batchId: undefined,
		updatedAt: Date.now(),
	});
}

/** Creates two batches for a class, splitting any existing students evenly between them. */
export async function enableForClass(ctx: AppMutationCtx, cls: Doc<"classes">) {
	const now = Date.now();

	const batch1Id = await ctx.db.insert("classBatches", {
		classId: cls._id,
		numIdx: 1,
		createdAt: now,
		updatedAt: now,
	});
	const batch2Id = await ctx.db.insert("classBatches", {
		classId: cls._id,
		numIdx: 2,
		createdAt: now,
		updatedAt: now,
	});

	const students = await ctx.db
		.query("students")
		.withIndex("by_class", (q) => q.eq("classId", cls._id))
		.collect();

	const sorted = [...students].sort(
		(a, b) => a._creationTime - b._creationTime,
	);
	const midpoint = Math.ceil(sorted.length / 2);

	for (const [index, student] of sorted.entries()) {
		await setBatch(ctx, {
			studentId: student._id,
			classId: cls._id,
			batchId: index < midpoint ? batch1Id : batch2Id,
		});
	}

	await ctx.db.patch("classes", cls._id, {
		isGroupsEnabled: true,
		batchNamingConvention: cls.batchNamingConvention ?? "numeric",
		updatedAt: now,
	});
}

/** Deletes all batches for a class and clears each member's batchId. Students themselves are untouched. */
export async function disableForClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
) {
	const batches = await ctx.db
		.query("classBatches")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.collect();

	const now = Date.now();

	for (const batch of batches) {
		const students = await ctx.db
			.query("students")
			.withIndex("by_class_and_batch", (q) =>
				q.eq("classId", classId).eq("batchId", batch._id),
			)
			.collect();

		for (const student of students) {
			await ctx.db.patch("students", student._id, {
				batchId: undefined,
				updatedAt: now,
			});
		}

		await ctx.db.delete("classBatches", batch._id);
	}

	await ctx.db.patch("classes", classId, {
		isGroupsEnabled: false,
		updatedAt: Date.now(),
	});
}

export async function updateNamingConvention(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
	convention: BatchNamingConvention,
) {
	await ctx.db.patch("classes", classId, {
		batchNamingConvention: convention,
		updatedAt: Date.now(),
	});
}

/** Creates the next-numbered batch for a class (numIdx = current max + 1). */
export async function createNextBatch(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
) {
	const batches = await ctx.db
		.query("classBatches")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.collect();

	const nextNumIdx =
		batches.length > 0 ? Math.max(...batches.map((b) => b.numIdx)) + 1 : 1;

	const now = Date.now();
	const batchId = await ctx.db.insert("classBatches", {
		classId,
		numIdx: nextNumIdx,
		createdAt: now,
		updatedAt: now,
	});

	const batch = await ctx.db.get("classBatches", batchId);
	if (!batch) throwAppError(ERROR_CODES.BATCH.NOT_FOUND);

	return batch;
}

export const MoveTargetDtoSchema = vv.object({
	classId: vv.id("classes"),
	className: vv.string(),
	batchId: vv.optional(vv.id("classBatches")),
	batchLabel: vv.optional(vv.string()),
	isCurrentClass: vv.boolean(),
});

export type MoveTargetDto = Infer<typeof MoveTargetDtoSchema>;

/**
 * Lists every valid bulk-move destination across the program that `currentClass`
 * belongs to: one entry per batch for the current class and any other
 * batch-enabled sibling class, and a single bare-class entry for siblings that
 * don't have batches enabled (since students can't be moved directly into a
 * batch-enabled class without picking a batch).
 */
export async function listMoveTargets(
	ctx: AppQueryCtx,
	currentClass: Doc<"classes">,
): Promise<MoveTargetDto[]> {
	const siblingClasses = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", currentClass.programId))
		.take(100);

	const targets: MoveTargetDto[] = [];

	for (const cls of siblingClasses) {
		const isCurrentClass = cls._id === currentClass._id;

		if (!cls.isGroupsEnabled) {
			if (isCurrentClass) continue;

			targets.push({
				classId: cls._id,
				className: cls.name,
				batchId: undefined,
				batchLabel: undefined,
				isCurrentClass: false,
			});
			continue;
		}

		const batches = await listByClass(ctx, cls._id, cls.batchNamingConvention);

		for (const batch of batches) {
			targets.push({
				classId: cls._id,
				className: cls.name,
				batchId: batch._id,
				batchLabel: batch.label,
				isCurrentClass,
			});
		}
	}

	return targets;
}
