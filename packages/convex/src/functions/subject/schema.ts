import { defineTable } from "convex/server";
import { v } from "convex/values";

export const subjectTables = {
	/**
	 * Subjects are the academic disciplines that are taught in the institution.
	 * Currently we store all subjects under the institution. Later we allocate subjects under programs and classes.
	 * with it's type (`theory`, `practical`, etc... ).
	 */
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
};
