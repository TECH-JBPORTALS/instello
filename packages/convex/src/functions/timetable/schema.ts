import { defineTable } from "convex/server";
import { v } from "convex/values";

export const timetableTables = {
	timetable: defineTable({
		classId: v.id("classes"),
		version: v.number(),
		createdBy: v.string(),
		changeMessage: v.string(),
		effectiveFrom: v.number(),
		sessionConfig: v.optional(
			v.object({
				totalHours: v.number(),
				periods: v.array(
					v.object({
						startTime: v.number(),
						endTime: v.number(),
					}),
				),
				lunchBreak: v.optional(
					v.object({
						enabled: v.boolean(),
						afterPeriod: v.number(),
						startTime: v.number(),
						endTime: v.number(),
					}),
				),
			}),
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_class_and_version", ["classId", "version"]),

	timetableSlots: defineTable({
		timetableId: v.id("timetable"),
		subjectId: v.id("subjects"),
		batchId: v.optional(v.id("classBatches")),
		/** 0 = Monday … 5 = Saturday */
		day: v.number(),
		startHour: v.number(),
		endHour: v.number(),
		room: v.optional(v.string()),
	}).index("by_timetable", ["timetableId"]),
};
