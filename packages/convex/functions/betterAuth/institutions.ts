import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { vv } from "./schema";

/**
 * Get a institution by their id
 */
export const getById = query({
	args: { id: v.string() },
	returns: vv.doc("institutions"),
	async handler(ctx, args) {
		const institution = await ctx.db
			.query("institutions")
			.withIndex("by_id", (q) => q.eq("_id", args.id as Id<"institutions">))
			.first();
		if (!institution) throw new Error("No institution found for given id");
		return institution;
	},
});
