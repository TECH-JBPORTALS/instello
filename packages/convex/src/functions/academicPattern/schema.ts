import { defineTable } from "convex/server";
import { v } from "convex/values";

export const academicPatternTables = {
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
};
