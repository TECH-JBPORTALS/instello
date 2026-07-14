import type { Infer } from "convex/values";
import { vv } from "#schema";
import { EntryStatusSchema } from "./record";

export const ActivityChangeSchema = vv.object({
	studentId: vv.id("students"),
	previousStatus: vv.optional(EntryStatusSchema),
	newStatus: EntryStatusSchema,
});

export const ActivityLogDtoSchema = vv.object({
	_id: vv.id("attendanceActivityLogs"),
	recordId: vv.id("attendanceRecords"),
	action: vv.union(vv.literal("marked"), vv.literal("updated")),
	performedBy: vv.object({
		_id: vv.string(),
		name: vv.string(),
		image: vv.optional(vv.string()),
	}),
	performedAt: vv.number(),
	changes: vv.array(ActivityChangeSchema),
});

export type ActivityLogDto = Infer<typeof ActivityLogDtoSchema>;
export type ActivityChange = Infer<typeof ActivityChangeSchema>;
