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
	batchId: Id<"classBatches">,
) {
	const assignments = await ctx.db
		.query("batchStudents")
		.withIndex("by_batch", (q) => q.eq("batchId", batchId))
		.collect();

	return assignments.length;
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
		const count = await countStudentsInBatch(ctx, batch._id);
		if (count < leastCount) {
			leastCount = count;
			leastBatch = batch;
		}
	}

	return leastBatch;
}

export async function assignStudent(
	ctx: AppMutationCtx,
	args: { batchId: Id<"classBatches">; studentId: Id<"students"> },
) {
	const now = Date.now();
	await ctx.db.insert("batchStudents", {
		batchId: args.batchId,
		studentId: args.studentId,
		createdAt: now,
		updatedAt: now,
	});
	await ctx.db.patch("students", args.studentId, {
		batchId: args.batchId,
		updatedAt: now,
	});
}

export async function getAssignmentForStudent(
	ctx: AppQueryCtx,
	studentId: Id<"students">,
) {
	return await ctx.db
		.query("batchStudents")
		.withIndex("by_student", (q) => q.eq("studentId", studentId))
		.unique();
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
		await assignStudent(ctx, {
			batchId: index < midpoint ? batch1Id : batch2Id,
			studentId: student._id,
		});
	}

	await ctx.db.patch("classes", cls._id, {
		isGroupsEnabled: true,
		batchNamingConvention: cls.batchNamingConvention ?? "numeric",
		updatedAt: now,
	});
}

/** Deletes all batches and batch assignments for a class. Students themselves are untouched. */
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
		const assignments = await ctx.db
			.query("batchStudents")
			.withIndex("by_batch", (q) => q.eq("batchId", batch._id))
			.collect();

		for (const assignment of assignments) {
			await ctx.db.patch("students", assignment.studentId, {
				batchId: undefined,
				updatedAt: now,
			});
			await ctx.db.delete("batchStudents", assignment._id);
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

/**
 * One-off backfill for `students.batchId`: copies the existing `batchStudents`
 * assignments (made before that field existed) onto the student documents.
 * Safe to run multiple times; already-synced students are left untouched.
 */
export async function backfillStudentBatchIds(ctx: AppMutationCtx) {
	const assignments = await ctx.db.query("batchStudents").collect();
	const now = Date.now();
	let patched = 0;

	for (const assignment of assignments) {
		const student = await ctx.db.get("students", assignment.studentId);
		if (!student || student.batchId === assignment.batchId) continue;

		await ctx.db.patch("students", assignment.studentId, {
			batchId: assignment.batchId,
			updatedAt: now,
		});
		patched += 1;
	}

	return patched;
}
