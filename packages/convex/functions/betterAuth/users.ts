import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { vv } from "./schema";

/**
 * Get a user by their userId. If user doesn't exists throws the convex error
 */
export const getById = query({
	args: { userId: v.string() },
	returns: vv.doc("users"),
	async handler(ctx, args) {
		const user = await ctx.db
			.query("users")
			.withIndex("userId", (q) => q.eq("userId", args.userId))
			.first();
		if (!user) throw new ConvexError("No user found for given userId");
		return user;
	},
});

/**
 * Get a user by their email safely. If user doesn't exists return null.
 */
export const safeGetByEmail = query({
	args: { email: v.string() },
	returns: vv.nullable(vv.doc("users")),
	async handler(ctx, args) {
		const user = await ctx.db
			.query("users")
			.withIndex("email_name", (q) => q.eq("email", args.email))
			.first();
		return user;
	},
});
