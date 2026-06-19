import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typedV } from "convex-helpers/validators";

const tables = {
	programs: defineTable({
		createdBy: v.string(),
		title: v.string(),
		alias: v.string(),
	}).index("by_createdBy", ["createdBy"]),
};

const schema = defineSchema(tables);

export const vv = typedV(schema);

export default schema;
