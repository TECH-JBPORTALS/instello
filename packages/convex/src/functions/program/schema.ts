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

	/** Faculty should be assingned to program to access resources under that program */
	programFaculty: defineTable({
		facultyId: v.id("faculty"),
		programId: v.id("programs"),
		createdAt: v.number(),
		updatedAt: v.number(),

		/** Only one person can be head of program */
		isHeadOfProgram: v.boolean(),
	})
		.index("by_program", ["programId"])
		.index("by_faculty", ["facultyId"])
		.index("by_program_and_faculty", ["programId", "facultyId"]),
};
