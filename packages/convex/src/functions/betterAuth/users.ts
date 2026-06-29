import { ConvexError, v } from "convex/values";
import { ERROR_CODES } from "../helpers/errors";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { vv } from "./schema";

/**
 * Get a user by their userId. If user doesn't exists throws the convex error
 */
export const getById = query({
	args: { userId: v.string() },
	returns: {
		_id: vv.id("user"),
		name: vv.string(),
		email: vv.string(),
		image: vv.nullable(vv.string()),
		role: vv.string(),
	},
	async handler(ctx, args) {
		const user = await ctx.db
			.query("user")
			.withIndex("by_id", (q) => q.eq("_id", args.userId as Id<"user">))
			.first();

		if (!user) throw new ConvexError(ERROR_CODES.BASE.USER_NOT_FOUND.message);

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			image: user.image ?? null,
			role: user.role ?? "user",
		};
	},
});

/**
 * Get a user by their email safely. If user doesn't exists return null.
 */
export const safeGetByEmail = query({
	args: { email: v.string() },
	returns: vv.nullable(vv.doc("user")),
	async handler(ctx, args) {
		const user = await ctx.db
			.query("user")
			.withIndex("email_name", (q) => q.eq("email", args.email))
			.first();
		return user;
	},
});
