import { defineTable } from "convex/server";
import { v } from "convex/values";

export const attendanceTables = {
	/** One register per unique subject (+ optional batch) in the class timetable */
	attendanceRegisters: defineTable({
		classId: v.id("classes"),
		subjectId: v.id("subjects"),
		batchId: v.optional(v.id("classBatches")),
		status: v.union(v.literal("active"), v.literal("archived")),
		archivedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_class_and_status", ["classId", "status"])
		.index("by_class_subject_batch", ["classId", "subjectId", "batchId"]),

	/** Attendance header for a marked session occurrence */
	attendanceRecords: defineTable({
		registerId: v.id("attendanceRegisters"),
		/** YYYY-MM-DD in the client's local timezone */
		sessionDate: v.string(),
		/** 0 = Monday … 5 = Saturday */
		day: v.number(),
		startHour: v.number(),
		endHour: v.number(),
		timetableVersion: v.number(),
		markedBy: v.string(),
		markedAt: v.number(),
		updatedAt: v.number(),
		presentCount: v.number(),
		absentCount: v.number(),
	})
		.index("by_register_and_sessionDate", ["registerId", "sessionDate"])
		.index("by_register_session_key", [
			"registerId",
			"sessionDate",
			"day",
			"startHour",
			"endHour",
		]),

	/** Per-student attendance for a marked session */
	attendanceEntries: defineTable({
		recordId: v.id("attendanceRecords"),
		studentId: v.id("students"),
		status: v.union(v.literal("present"), v.literal("absent")),
	})
		.index("by_record", ["recordId"])
		.index("by_record_and_student", ["recordId", "studentId"]),

	/** Audit trail for attendance mark and update actions */
	attendanceActivityLogs: defineTable({
		recordId: v.id("attendanceRecords"),
		action: v.union(v.literal("marked"), v.literal("updated")),
		performedBy: v.string(),
		performedAt: v.number(),
		changes: v.array(
			v.object({
				studentId: v.id("students"),
				previousStatus: v.optional(
					v.union(v.literal("present"), v.literal("absent")),
				),
				newStatus: v.union(v.literal("present"), v.literal("absent")),
			}),
		),
	}).index("by_record", ["recordId"]),
};
