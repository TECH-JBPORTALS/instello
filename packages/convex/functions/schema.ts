import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";

const tables = {
	programs: defineTable({
		createdBy: v.string(),
		name: v.string(),
		alias: v.string(),
		status: v.union(v.literal("inactive"), v.literal("active")),
		institutionId: v.string(),
	}).index("by_institution", ["institutionId"]),
};

const schema = defineSchema(tables);

export const vv = typedV(schema);

export default schema;
