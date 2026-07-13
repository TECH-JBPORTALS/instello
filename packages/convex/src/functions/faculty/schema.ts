import { defineTable } from "convex/server";
import { v } from "convex/values";

export const facultyTables = {
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
};
