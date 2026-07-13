import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";
import { academicPatternTables } from "./academicPattern/schema";
import { classTables } from "./class/schema";
import { facultyTables } from "./faculty/schema";
import { institutionTables } from "./institution/schema";
import { programTables } from "./program/schema";
import { studentTables } from "./student/schema";
import { subjectTables } from "./subject/schema";

const tables = {
	/** This model is only for owner who owns an organization.
	 * Better auth `organization` has been remapped to `institution`.
	 * For more info checkout [auth.ts](./auth.ts) */
	ownerOrganizations: defineTable({
		ownerId: v.string(),
		name: v.string(),
		slug: v.string(),
		addressLine: v.string(),
		city: v.string(),
		state: v.string(),
		postalCode: v.string(),
		country: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_owner", ["ownerId"]),

	/** Application access requests raised by owners from the marketing page */
	accessRequests: defineTable({
		email: v.string(),
		phoneNumber: v.string(),
		status: v.union(
			v.literal("rejected"),
			v.literal("approved"),
			v.literal("pending"),
		),
		orgName: v.string(),
		orgAddress: v.string(),
		orgAddressCity: v.string(),
		orgAddressState: v.string(),
		orgAddressCountry: v.string(),
		orgPostalCode: v.string(),
		approvedAt: v.optional(v.number()),
		rejectedAt: v.optional(v.number()),
		rejectedReason: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}),

	...academicPatternTables,
	...facultyTables,
	...institutionTables,
	...programTables,
	...subjectTables,
	...classTables,
	...studentTables,

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

const schema = defineSchema(tables);

export const vv = typedV(schema);

export default schema;
