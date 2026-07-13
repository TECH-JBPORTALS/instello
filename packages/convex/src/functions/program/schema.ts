import { defineTable } from "convex/server";
import { v } from "convex/values";

export const programTables = {
	/** It's normally known as Branches in the realworld which students enrolled in the institution */
	programs: defineTable({
		createdBy: v.string(),
		name: v.string(),
		alias: v.string(),
		status: v.union(v.literal("inactive"), v.literal("active")),
		institutionId: v.string(),
		/** Soft gate while cascade deletion runs; treated as not found by public APIs. */
		isDeleting: v.optional(v.boolean()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_institution_name", ["institutionId", "name"])
		.index("by_institution_and_alias", ["institutionId", "alias"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["institutionId"],
		}),
};
