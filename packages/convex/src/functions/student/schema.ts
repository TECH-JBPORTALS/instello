import { defineTable } from "convex/server";
import { v } from "convex/values";

export const studentTables = {
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
};
