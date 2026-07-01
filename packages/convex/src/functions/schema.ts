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

	/** Users can enable groups inside classes to divide students into smaller groups known as sections and batches */
	classGroups: defineTable({
		classId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		numIdx: v.number(),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	}),

	/** Faculty are the teachers who teach the students in the classes also may be non teaching staff like owner, principal, librarian, etc. */
	faculty: defineTable({
		institutionId: v.string(),
		staffId: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		dateOfBirth: v.string(),
		email: v.string(),
		profilePicUrl: v.optional(v.string()),
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
		.index("by_institution_and_status", ["institutionId", "status"]),

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

	// programSubjects: defineTable({
	// 	programId: v.string(),
	// 	subjectId: v.string(),
	// 	semester: v.number(),
	// 	type: v.union(v.literal("theory"), v.literal("practical")),
	// 	createdAt: v.number(),
	// 	updatedAt: v.number(),
	// }).index("by_subject", ["subjectId"]),

	// classSubjectsAllocation: defineTable({
	// 	classId: v.string(),
	// 	programSubjectId: v.string(),
	// 	userId: v.string(),
	// 	facultyId: v.optional(v.string()),
	// 	createdAt: v.number(),
	// 	updatedAt: v.number(),
	// })
	// 	.index("by_class", ["classId"])
	// 	.index("by_program_subject", ["programSubjectId"])
	// 	.index("by_faculty", ["facultyId"]),
};

const schema = defineSchema(tables);

export const vv = typedV(schema);

export default schema;
