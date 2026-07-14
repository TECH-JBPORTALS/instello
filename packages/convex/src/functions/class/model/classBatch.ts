import type { Doc, Id } from "../../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import type {
	BatchDto,
	BatchNamingConvention,
	MoveTargetDto,
	RemovePreview,
} from "../validator/classBatch";

export type {
	BatchDto,
	BatchNamingConvention,
	MoveTargetDto,
	RemovePreview,
} from "../validator/classBatch";
export {
	BatchDtoSchema,
	BatchNamingConventionSchema,
	MoveTargetDtoSchema,
	RemovePreviewSchema,
} from "../validator/classBatch";

const DELETE_BATCH_SIZE = 40;

export function isLive(batch: Doc<"classBatches">) {
	return batch.isDeleting !== true;
}

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
	studentCount: number,
): BatchDto {
	return {
		_id: batch._id,
		classId: batch.classId,
		numIdx: batch.numIdx,
		label: getBatchLabel(batch.numIdx, convention),
		studentCount,
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

	const liveBatches = batches
		.filter(isLive)
		.sort((a, b) => a.numIdx - b.numIdx);

	return Promise.all(
		liveBatches.map(async (batch) => {
			const studentCount = await countStudentsInBatch(ctx, {
				classId,
				batchId: batch._id,
			});
			return toDto(batch, convention, studentCount);
		}),
	);
}

export async function getById(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"classBatches">,
) {
	const batch = await ctx.db.get("classBatches", id);
	if (!batch || !isLive(batch)) return null;
	return batch;
}

/** Returns the batch even when `isDeleting` (for cascade workers). */
export async function getByIdIncludingDeleting(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"classBatches">,
) {
	return await ctx.db.get("classBatches", id);
}

/** Verifies a batch belongs to the given class. */
export async function ensureInClass(
	ctx: AppQueryCtx | AppMutationCtx,
	batchId: Id<"classBatches">,
	classId: Id<"classes">,
) {
	const batch = await getByIdIncludingDeleting(ctx, batchId);

	if (!batch || batch.classId !== classId || !isLive(batch)) {
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

	for (const batch of batches.filter(isLive)) {
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

/** Among other live batches, picks the one with the fewest students. */
export async function pickRedistributionTarget(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
	excludeBatchId: Id<"classBatches">,
) {
	const batches = await ctx.db
		.query("classBatches")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.collect();

	let targetBatch: Doc<"classBatches"> | null = null;
	let leastCount = Number.POSITIVE_INFINITY;

	for (const batch of batches.filter(
		(b) => isLive(b) && b._id !== excludeBatchId,
	)) {
		const count = await countStudentsInBatch(ctx, {
			classId,
			batchId: batch._id,
		});
		if (count < leastCount) {
			leastCount = count;
			targetBatch = batch;
		}
	}

	return targetBatch;
}

async function countLiveBatchesInClass(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
) {
	const batches = await ctx.db
		.query("classBatches")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.collect();

	return batches.filter(isLive).length;
}

function slotsOverlap(args: {
	dayA: number;
	startHourA: number;
	endHourA: number;
	dayB: number;
	startHourB: number;
	endHourB: number;
}) {
	return (
		args.dayA === args.dayB &&
		args.startHourA < args.endHourB &&
		args.endHourA > args.startHourB
	);
}

async function hasTimetableConflictWithTarget(
	ctx: AppQueryCtx | AppMutationCtx,
	args: {
		classId: Id<"classes">;
		sourceBatchId: Id<"classBatches">;
		targetBatchId: Id<"classBatches">;
	},
) {
	const latestTimetable = await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) => q.eq("classId", args.classId))
		.order("desc")
		.first();

	if (!latestTimetable) return false;

	const slots = await ctx.db
		.query("timetableSlots")
		.withIndex("by_timetable", (q) => q.eq("timetableId", latestTimetable._id))
		.collect();

	const sourceSlots = slots.filter(
		(slot) => slot.batchId === args.sourceBatchId,
	);
	if (sourceSlots.length === 0) return false;

	const targetSlots = slots.filter(
		(slot) => slot.batchId === args.targetBatchId,
	);
	if (targetSlots.length === 0) return false;

	for (const sourceSlot of sourceSlots) {
		for (const targetSlot of targetSlots) {
			if (
				slotsOverlap({
					dayA: sourceSlot.day,
					startHourA: sourceSlot.startHour,
					endHourA: sourceSlot.endHour,
					dayB: targetSlot.day,
					startHourB: targetSlot.startHour,
					endHourB: targetSlot.endHour,
				})
			) {
				return true;
			}
		}
	}

	return false;
}

export async function getRemovePreview(
	ctx: AppQueryCtx,
	batch: Doc<"classBatches">,
	convention: BatchNamingConvention,
): Promise<RemovePreview> {
	const batchLabel = getBatchLabel(batch.numIdx, convention);
	const liveBatchCount = await countLiveBatchesInClass(ctx, batch.classId);
	const canDelete = liveBatchCount > 1;
	const studentCount = await countStudentsInBatch(ctx, {
		classId: batch.classId,
		batchId: batch._id,
	});

	let hasTimetableConflict = false;
	let blockedReason: RemovePreview["blockedReason"];
	let moveToBatch: RemovePreview["moveToBatch"];

	if (canDelete) {
		const target = await pickRedistributionTarget(
			ctx,
			batch.classId,
			batch._id,
		);
		if (target) {
			moveToBatch = {
				_id: target._id,
				label: getBatchLabel(target.numIdx, convention),
			};

			hasTimetableConflict = await hasTimetableConflictWithTarget(ctx, {
				classId: batch.classId,
				sourceBatchId: batch._id,
				targetBatchId: target._id,
			});
			if (hasTimetableConflict) {
				blockedReason = ERROR_CODES.BATCH.TIMETABLE_CONFLICT.message;
			}
		}
	}

	return {
		batchLabel,
		studentCount,
		canDelete,
		hasTimetableConflict,
		blockedReason,
		moveToBatch,
	};
}

export async function markDeleting(
	ctx: AppMutationCtx,
	id: Id<"classBatches">,
) {
	await ctx.db.patch("classBatches", id, {
		isDeleting: true,
		updatedAt: Date.now(),
	});
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

/** Disables batches for a class by id. Deletes all batches and batch
 * assignments; students remain in the class without a batch.
 */
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

/** Updates the batch naming convention for a class. */
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

export async function clearBatch(
	ctx: AppMutationCtx,
	studentId: Id<"students">,
) {
	await ctx.db.patch("students", studentId, {
		batchId: undefined,
		updatedAt: Date.now(),
	});
}

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
		if (cls.isDeleting === true) continue;

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

async function archiveAttendanceForBatch(
	ctx: AppMutationCtx,
	args: { classId: Id<"classes">; batchId: Id<"classBatches"> },
): Promise<boolean> {
	const registers = await ctx.db
		.query("attendanceRegisters")
		.withIndex("by_class_and_status", (q) =>
			q.eq("classId", args.classId).eq("status", "active"),
		)
		.take(DELETE_BATCH_SIZE);

	const batchRegisters = registers.filter(
		(register) => register.batchId === args.batchId,
	);

	if (batchRegisters.length === 0) return false;

	const now = Date.now();
	for (const register of batchRegisters) {
		await ctx.db.patch("attendanceRegisters", register._id, {
			status: "archived",
			archivedAt: now,
			updatedAt: now,
		});
	}
	return true;
}

async function reassignTimetableSlotsToBatch(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		sourceBatchId: Id<"classBatches">;
		targetBatchId: Id<"classBatches">;
	},
): Promise<boolean> {
	const latestTimetable = await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) => q.eq("classId", args.classId))
		.order("desc")
		.first();

	if (!latestTimetable) return false;

	const slots = await ctx.db
		.query("timetableSlots")
		.withIndex("by_timetable", (q) => q.eq("timetableId", latestTimetable._id))
		.take(DELETE_BATCH_SIZE);

	const batchSlots = slots.filter(
		(slot) => slot.batchId === args.sourceBatchId,
	);
	if (batchSlots.length === 0) return false;

	for (const slot of batchSlots) {
		await ctx.db.patch("timetableSlots", slot._id, {
			batchId: args.targetBatchId,
		});
	}

	return true;
}

async function redistributeStudentsFromBatch(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		sourceBatchId: Id<"classBatches">;
		targetBatchId: Id<"classBatches">;
	},
): Promise<boolean> {
	const students = await ctx.db
		.query("students")
		.withIndex("by_class_and_batch", (q) =>
			q.eq("classId", args.classId).eq("batchId", args.sourceBatchId),
		)
		.take(DELETE_BATCH_SIZE);

	if (students.length === 0) return false;

	for (const student of students) {
		await setBatch(ctx, {
			studentId: student._id,
			classId: args.classId,
			batchId: args.targetBatchId,
		});
	}
	return true;
}

/**
 * Deletes batch-related data in bounded batches.
 * Returns `true` when more work remains (caller should reschedule).
 */
export async function deleteCascadeBatch(
	ctx: AppMutationCtx,
	batchId: Id<"classBatches">,
): Promise<boolean> {
	const batch = await getByIdIncludingDeleting(ctx, batchId);
	if (!batch) return false;
	const target = await pickRedistributionTarget(ctx, batch.classId, batch._id);
	if (!target) return false;

	if (
		await redistributeStudentsFromBatch(ctx, {
			classId: batch.classId,
			sourceBatchId: batch._id,
			targetBatchId: target._id,
		})
	) {
		return true;
	}

	if (
		await reassignTimetableSlotsToBatch(ctx, {
			classId: batch.classId,
			sourceBatchId: batch._id,
			targetBatchId: target._id,
		})
	) {
		return true;
	}

	if (
		await archiveAttendanceForBatch(ctx, {
			classId: batch.classId,
			batchId: batch._id,
		})
	) {
		return true;
	}

	await ctx.db.delete("classBatches", batch._id);
	return false;
}

/**
 * Asserts weather the batch can be removed in the current state.
 * Also verifies that the batch has no timetable conflicts with the target batch.
 */
export async function assertCanRemove(
	ctx: AppQueryCtx | AppMutationCtx,
	batch: Doc<"classBatches">,
) {
	if (!isLive(batch)) {
		throwAppError(ERROR_CODES.BATCH.ALREADY_DELETING);
	}

	const liveBatchCount = await countLiveBatchesInClass(ctx, batch.classId);
	if (liveBatchCount <= 1) {
		throwAppError(ERROR_CODES.BATCH.LAST_REMAINING);
	}

	const target = await pickRedistributionTarget(ctx, batch.classId, batch._id);
	if (!target) {
		throwAppError(ERROR_CODES.BATCH.LAST_REMAINING);
	}

	if (
		await hasTimetableConflictWithTarget(ctx, {
			classId: batch.classId,
			sourceBatchId: batch._id,
			targetBatchId: target._id,
		})
	) {
		throwAppError(ERROR_CODES.BATCH.TIMETABLE_CONFLICT);
	}
}
