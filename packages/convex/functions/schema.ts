import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	programs: defineTable({
		createdBy: v.string(),
		title: v.string(),
		alias: v.string(),
	}).index("by_createdBy", ["createdBy"]),
});
