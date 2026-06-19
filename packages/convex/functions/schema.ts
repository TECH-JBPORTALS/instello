import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const tables = {
	programs: defineTable({
		createdBy: v.string(),
		title: v.string(),
		alias: v.string(),
	}).index("by_createdBy", ["createdBy"]),
};

export default defineSchema(tables);
