import { defineTable } from "convex/server";
import { v } from "convex/values";

export const classTables = {
	/** Classes are batches of students in a program which they go through in a semester cycle to complete their academics */
	classes: defineTable({
		programId: v.id("programs"),
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
		/** Soft gate while cascade deletion runs; treated as not found by public APIs. */
		isDeleting: v.optional(v.boolean()),
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
		/** Soft gate while cascade deletion runs; hidden from public APIs. */
		isDeleting: v.optional(v.boolean()),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	}).index("by_class", ["classId"]),
};
