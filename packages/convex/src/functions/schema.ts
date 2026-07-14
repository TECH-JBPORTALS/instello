import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";
import { academicPatternTables } from "./academicPattern/schema";
import { attendanceTables } from "./attendance/schema";
import { classTables } from "./class/schema";
import { facultyTables } from "./faculty/schema";
import { institutionTables } from "./institution/schema";
import { programTables } from "./program/schema";
import { studentTables } from "./student/schema";
import { subjectTables } from "./subject/schema";
import { timetableTables } from "./timetable/schema";

const tables = {
	/** This model is only for owner who owns an organization.
	 * Better auth `organization` has been remapped to `institution`.
	 * For more info checkout [auth.ts](./auth.ts) */
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

	...academicPatternTables,
	...facultyTables,
	...institutionTables,
	...programTables,
	...subjectTables,
	...classTables,
	...studentTables,
	...timetableTables,
	...attendanceTables,
};

const schema = defineSchema(tables);

export const vv = typedV(schema);

export default schema;
