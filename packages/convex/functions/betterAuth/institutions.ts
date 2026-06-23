import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { vv } from "./schema";

/**
 * Get a institution by their id
 */
export const getById = query({
	args: { id: vv.string() },
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

export const firstByUser = query({
	args: { userId: vv.string() },
	returns: vv.nullable(vv.doc("institutions")),
	handler: async (ctx, args) => {
		const institutionMembership = await ctx.db
			.query("institutionMembers")
			.withIndex("userId", (q) => q.eq("userId", args.userId))
			.first();

		if (!institutionMembership) return null;

		const institution = await ctx.db
			.query("institutions")
			.withIndex("by_id", (q) =>
				q.eq("_id", institutionMembership.organizationId as Id<"institutions">),
			)
			.first();

		return institution;
	},
});
