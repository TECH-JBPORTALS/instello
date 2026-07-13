import { defineTable } from "convex/server";
import { v } from "convex/values";

export const institutionTables = {
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

	/** Reservation / admission categories configured per institution (e.g. GM, Cat-1, SC) */
	institutionStudentCategories: defineTable({
		institutionId: v.string(),
		name: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_institution", ["institutionId"]),
};
