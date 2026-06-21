import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";
import { tables } from "./authSchema";

const schema = defineSchema({
	...tables,

	/** This model is only for owner who owns an organization.
	 * Better auth `ownerOrganizations` has been remapped to `institutions`.
	 * For more info checkout [./auth.ts](./auth.ts) */
	ownerOrganizations: defineTable({
		ownerId: v.id("users"),
		name: v.string(),
		slug: v.string(),
		addressLine: v.string(),
		city: v.string(),
		state: v.string(),
		postalCode: v.string(),
		country: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}),

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
});

export const vv = typedV(schema);
export default schema;
