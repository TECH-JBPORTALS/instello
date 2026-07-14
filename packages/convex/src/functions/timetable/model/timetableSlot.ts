import type { Id } from "../../_generated/dataModel";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import type { SlotInput } from "../validator/timetable";

/** Lists all slots for a timetable version. */
export async function listByTimetable(
	ctx: AppQueryCtx | AppMutationCtx,
	timetableId: Id<"timetable">,
) {
	return await ctx.db
		.query("timetableSlots")
		.withIndex("by_timetable", (q) => q.eq("timetableId", timetableId))
		.collect();
}

/** Inserts slots for a newly created timetable version. */
export async function insertMany(
	ctx: AppMutationCtx,
	timetableId: Id<"timetable">,
	slots: SlotInput[],
) {
	for (const slot of slots) {
		await ctx.db.insert("timetableSlots", {
			timetableId,
			subjectId: slot.subjectId,
			batchId: slot.batchId,
			day: slot.day,
			startHour: slot.startHour,
			endHour: slot.endHour,
			room: slot.room,
		});
	}
}

/**
 * Deletes up to `limit` slots for a timetable.
 * Returns `true` when at least one slot was deleted.
 */
export async function deleteBatchForTimetable(
	ctx: AppMutationCtx,
	timetableId: Id<"timetable">,
	limit: number,
): Promise<boolean> {
	const slots = await ctx.db
		.query("timetableSlots")
		.withIndex("by_timetable", (q) => q.eq("timetableId", timetableId))
		.take(limit);

	if (slots.length === 0) return false;

	for (const slot of slots) {
		await ctx.db.delete("timetableSlots", slot._id);
	}
	return true;
}
