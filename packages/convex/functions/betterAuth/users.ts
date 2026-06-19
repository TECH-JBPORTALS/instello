import { v } from "convex/values";
import { query } from "./_generated/server";
import { vv } from "./schema";

/**
 * Get a user by their userId
 */
export const get = query({
	args: { userId: v.string() },
	returns: vv.doc("users"),
	async handler(ctx, args) {
		const user = await ctx.db
			.query("users")
			.withIndex("userId", (q) => q.eq("userId", args.userId))
			.first();
		if (!user) throw new Error("No user found for given userId");
		return user;
	},
});
