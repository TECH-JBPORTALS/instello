import type { Id } from "../../_generated/dataModel";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import type { SlotInput } from "../../timetable/validator/timetable";

const DELETE_BATCH_SIZE = 40;

export type SubjectBatchCombo = {
	subjectId: Id<"subjects">;
	batchId?: Id<"classBatches">;
};

function comboKey(combo: SubjectBatchCombo): string {
	return `${combo.subjectId}:${combo.batchId ?? "whole"}`;
}

/** Extract unique subject and batch combinations from slots. */
export function extractUniqueCombos(slots: SlotInput[]): SubjectBatchCombo[] {
	const seen = new Set<string>();
	const combos: SubjectBatchCombo[] = [];

	for (const slot of slots) {
		const combo: SubjectBatchCombo = {
			subjectId: slot.subjectId,
			...(slot.batchId ? { batchId: slot.batchId } : {}),
		};
		const key = comboKey(combo);
		if (seen.has(key)) continue;
		seen.add(key);
		combos.push(combo);
	}

	return combos;
}

/** Get a register by ID. */
export async function getById(
	ctx: AppQueryCtx | AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
) {
	return await ctx.db.get("attendanceRegisters", registerId);
}

/** Find a register by class, subject and batch. */
export async function findByCombo(
	ctx: AppQueryCtx | AppMutationCtx,
	args: {
		classId: Id<"classes">;
		subjectId: Id<"subjects">;
		batchId?: Id<"classBatches">;
	},
) {
	return await ctx.db
		.query("attendanceRegisters")
		.withIndex("by_class_subject_batch", (q) =>
			q
				.eq("classId", args.classId)
				.eq("subjectId", args.subjectId)
				.eq("batchId", args.batchId),
		)
		.unique();
}

/** List registers by class. */
export async function listByClass(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
	status?: "active" | "archived",
) {
	if (status) {
		return await ctx.db
			.query("attendanceRegisters")
			.withIndex("by_class_and_status", (q) =>
				q.eq("classId", classId).eq("status", status),
			)
			.collect();
	}

	return await ctx.db
		.query("attendanceRegisters")
		.withIndex("by_class_and_status", (q) => q.eq("classId", classId))
		.collect();
}

/**
 * Ensures active registers exist for every subject(+batch) in the slots.
 * Archives registers whose combo is no longer present. Safe to call repeatedly.
 */
export async function syncFromTimetable(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		slots: SlotInput[];
	},
) {
	const combos = extractUniqueCombos(args.slots);
	const comboKeys = new Set(combos.map(comboKey));
	const now = Date.now();

	const existing = await listByClass(ctx, args.classId);

	for (const combo of combos) {
		const register = await findByCombo(ctx, {
			classId: args.classId,
			subjectId: combo.subjectId,
			batchId: combo.batchId,
		});

		if (!register) {
			await ctx.db.insert("attendanceRegisters", {
				classId: args.classId,
				subjectId: combo.subjectId,
				batchId: combo.batchId,
				status: "active",
				createdAt: now,
				updatedAt: now,
			});
			continue;
		}

		if (register.status === "archived") {
			await ctx.db.patch("attendanceRegisters", register._id, {
				status: "active",
				archivedAt: undefined,
				updatedAt: now,
			});
		}
	}

	for (const register of existing) {
		const key = comboKey({
			subjectId: register.subjectId,
			batchId: register.batchId,
		});
		if (comboKeys.has(key) || register.status === "archived") {
			continue;
		}

		await ctx.db.patch("attendanceRegisters", register._id, {
			status: "archived",
			archivedAt: now,
			updatedAt: now,
		});
	}
}

/** Delete a register and its associated data in bounded batches.
 * TODO: Later we have to divide the responsibility of deleting the register and its associated data to different functions.
 */
async function deleteRegisterTreeBatch(
	ctx: AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
): Promise<boolean> {
	const records = await ctx.db
		.query("attendanceRecords")
		.withIndex("by_register_and_sessionDate", (q) =>
			q.eq("registerId", registerId),
		)
		.take(DELETE_BATCH_SIZE);

	if (records.length === 0) return false;

	for (const record of records) {
		const entries = await ctx.db
			.query("attendanceEntries")
			.withIndex("by_record", (q) => q.eq("recordId", record._id))
			.take(DELETE_BATCH_SIZE);

		if (entries.length > 0) {
			for (const entry of entries) {
				await ctx.db.delete("attendanceEntries", entry._id);
			}
			return true;
		}

		const logs = await ctx.db
			.query("attendanceActivityLogs")
			.withIndex("by_record", (q) => q.eq("recordId", record._id))
			.take(DELETE_BATCH_SIZE);

		if (logs.length > 0) {
			for (const log of logs) {
				await ctx.db.delete("attendanceActivityLogs", log._id);
			}
			return true;
		}

		await ctx.db.delete("attendanceRecords", record._id);
	}

	return true;
}

/**
 * Deletes attendance data for a class in bounded batches.
 * Returns `true` when more work remains.
 */
export async function deleteForClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<boolean> {
	const registers = await ctx.db
		.query("attendanceRegisters")
		.withIndex("by_class_and_status", (q) => q.eq("classId", classId))
		.take(DELETE_BATCH_SIZE);

	if (registers.length === 0) return false;

	for (const register of registers) {
		const hasMoreRecords = await deleteRegisterTreeBatch(ctx, register._id);
		if (hasMoreRecords) return true;
		await ctx.db.delete("attendanceRegisters", register._id);
	}
	return true;
}
