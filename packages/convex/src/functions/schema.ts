import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";

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

	/**
	 * Academic patterns are the patterns of academic years and semesters.
	 * Varies from institution to institution. So let's store under global owner organization */
	academicPatterns: defineTable({
		ownerOrganizationId: v.id("ownerOrganizations"),
		name: v.string(),
		description: v.optional(v.string()),
		systemType: v.union(v.literal("semester"), v.literal("annual")),
		durationInYears: v.number(),
		templateKey: v.optional(
			v.union(v.literal("engineering"), v.literal("diploma")),
		),
		/** Once these patterns are being used by an institution, we don't want to edit them. */
		canBeEdited: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_ownerOrganization", ["ownerOrganizationId"])
		.index("by_ownerOrganization_and_templateKey", [
			"ownerOrganizationId",
			"templateKey",
		]),

	/** Academic stages are the stages of academic years and semesters. Based on the current academic pattern. */
	academicStages: defineTable({
		name: v.string(),
		alias: v.string(),
		description: v.optional(v.string()),
		academicPatternId: v.id("academicPatterns"),
		sequenceNumber: v.number(),
		yearNumber: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_academicPattern", ["academicPatternId"])
		.index("by_academicPattern_and_sequence", [
			"academicPatternId",
			"sequenceNumber",
		]),

	/** Links an institution to an academic pattern adopted from its owner organization */
	institutionAcademicPatterns: defineTable({
		institutionId: v.string(),
		academicPatternId: v.id("academicPatterns"),
		ownerOrganizationId: v.id("ownerOrganizations"),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_institution", ["institutionId"])
		.index("by_academicPattern", ["academicPatternId"]),

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

	/** It's normally known as Branches in the realworld which students enrolled in the institution */
	programs: defineTable({
		createdBy: v.string(),
		name: v.string(),
		alias: v.string(),
		status: v.union(v.literal("inactive"), v.literal("active")),
		institutionId: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_institution_name", ["institutionId", "name"])
		.index("by_institution_and_alias", ["institutionId", "alias"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["institutionId"],
		}),

	/** Classes are batches of students in a program which they go through in a semester cycle to complete their academics */
	classes: defineTable({
		programId: v.string(),
		name: v.string(),
		slug: v.string(),
		description: v.optional(v.string()),
		isGroupsEnabled: v.boolean(),
		/** How batch labels are displayed once batches are enabled. Defaults to "numeric". */
		batchNamingConvention: v.optional(
			v.union(v.literal("numeric"), v.literal("alphabetic")),
		),
		currentHeadStageId: v.id("academicStages"),
		status: v.union(v.literal("inactive"), v.literal("active")),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	})
		.index("by_program", ["programId"])
		.index("by_program_and_slug", ["programId", "slug"])
		.index("by_program_and_name", ["programId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["programId"],
		}),

	/** Users can enable batches inside classes to divide students into smaller groups */
	classBatches: defineTable({
		classId: v.id("classes"),
		numIdx: v.number(),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	}).index("by_class", ["classId"]),

	/** Students enrolled in a class within an institution */
	students: defineTable({
		institutionId: v.string(),
		classId: v.id("classes"),
		firstName: v.string(),
		lastName: v.string(),
		usn: v.string(),
		email: v.string(),
		gender: v.union(
			v.literal("male"),
			v.literal("female"),
			v.literal("others"),
		),
		categoryId: v.id("institutionStudentCategories"),
		phoneNumber: v.string(),
		apaarId: v.optional(v.string()),
		image: v.optional(v.id("_storage")),
		fatherName: v.optional(v.string()),
		fatherPhoneNumber: v.optional(v.string()),
		motherName: v.optional(v.string()),
		motherPhoneNumber: v.optional(v.string()),
		addressLine: v.optional(v.string()),
		city: v.optional(v.string()),
		state: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		country: v.optional(v.string()),
		createdBy: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),

		/**
		 * The student's current batch assignment (only set when the class has batches
		 * enabled). This is the sole record of batch membership — there is no separate
		 * join table — so every write path must verify the batch belongs to this same
		 * `classId` before setting it (see `ClassBatch.ensureInClass`).
		 */
		batchId: v.optional(v.id("classBatches")),

		/**
		 * This is used for search index on selected column values
		 * Currently we are storing the student name and usn in this column for search index.
		 * So we can search by name or usn or both. becasue some limitation in convex searchIndex functionality.
		 *  */
		searchString: v.optional(v.string()),
	})
		.index("by_class", ["classId"])
		.index("by_class_and_batch", ["classId", "batchId"])
		.index("by_institution_and_email", ["institutionId", "email"])
		.index("by_usn", ["usn"])
		.searchIndex("search_by_searchString", {
			searchField: "searchString",
			filterFields: ["institutionId", "classId", "usn", "email"],
			staged: true,
		}),

	/** Faculty are the teachers who teach the students in the classes also may be non teaching staff like owner, principal, librarian, etc. */
	faculty: defineTable({
		institutionId: v.string(),
		staffId: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		dateOfBirth: v.string(),
		email: v.string(),
		image: v.optional(v.id("_storage")),
		designation: v.string(),
		joinedDate: v.optional(v.number()),
		qualification: v.string(),
		specialization: v.string(),
		phone: v.object({
			number: v.string(),
			verified: v.boolean(),
		}),
		status: v.union(v.literal("inactive"), v.literal("active")),
		userId: v.optional(v.string()),
		createdBy: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_institution", ["institutionId"])
		.index("by_institution_and_email", ["institutionId", "email"])
		.index("by_institution_and_staff_id", ["institutionId", "staffId"])
		.index("by_institution_and_status", ["institutionId", "status"])
		.index("by_institution_and_status_and_staff_id", [
			"institutionId",
			"status",
			"staffId",
		]),

	/**
	 * Subjects are the academic disciplines that are taught in the institution.
	 * Currently we store all subjects under the institution. Later we allocate subjects under programs and classes.
	 * with it's type (`theory`, `practical`, etc... ).
	 * */
	subjects: defineTable({
		name: v.string(),
		color: v.string(),
		code: v.string(),
		alias: v.string(),
		status: v.union(v.literal("inactive"), v.literal("active")),
		description: v.optional(v.string()),
		institutionId: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_institution", ["institutionId"])
		.index("by_institution_name", ["institutionId", "name"])
		.index("by_institution_and_alias", ["institutionId", "alias"])
		.index("by_institution_and_code", ["institutionId", "code"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["institutionId"],
		}),

	/** Reservation / admission categories configured per institution (e.g. GM, Cat-1, SC) */
	institutionStudentCategories: defineTable({
		institutionId: v.string(),
		name: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_institution", ["institutionId"]),

	/**
	 * Subjects allocated to a program for a given academic stage (semester/year),
	 * with the type (`theory`, `practical`) they're taught as in that stage.
	 */
	programSubjects: defineTable({
		programId: v.id("programs"),
		subjectId: v.id("subjects"),
		academicStageId: v.id("academicStages"),
		type: v.union(v.literal("theory"), v.literal("practical")),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_program_and_stage", ["programId", "academicStageId"])
		.index("by_program_and_stage_and_subject", [
			"programId",
			"academicStageId",
			"subjectId",
		])
		.index("by_subject", ["subjectId"]),

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
