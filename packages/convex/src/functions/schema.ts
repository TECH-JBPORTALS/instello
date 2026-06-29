import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";

const tables = {
	/** This model is only for owner who owns an organization.
	 * Better auth `ownerOrganizations` has been remapped to `institutions`.
	 * For more info checkout [./auth.ts](./auth.ts) */
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
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["institutionId"],
		}),
	classes: defineTable({
		programId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		isGroupsEnabled: v.boolean(),
		academicYear: v.number(),
		semester: v.number(),
		status: v.union(v.literal("inactive"), v.literal("active")),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	}).index("by_program", ["programId"]),
	classGroups: defineTable({
		classId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		numIdx: v.number(),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	}),
	faculty: defineTable({
		institutionId: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		dateOfBirth: v.string(),
		email: v.string(),
		profilePicUrl: v.optional(v.string()),
		addressLine: v.string(),
		district: v.string(),
		state: v.string(),
		country: v.string(),
		zipCode: v.string(),
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
		.index("by_institution_and_status", ["institutionId", "status"]),
};

const schema = defineSchema(tables);

export const vv = typedV(schema);

export default schema;
