import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { vv } from "./schema";

/**
 * Get a institution by their id
 */
export const getById = query({
	args: { id: vv.string() },
	returns: vv.doc("institution"),
	async handler(ctx, args) {
		const institution = await ctx.db
			.query("institution")
			.withIndex("by_id", (q) => q.eq("_id", args.id as Id<"institution">))
			.first();
		if (!institution) throw new Error("No institution found for given id");
		return institution;
	},
});

export const firstByUser = query({
	args: { userId: vv.string() },
	returns: vv.nullable(vv.doc("institution")),
	handler: async (ctx, args) => {
		const institutionMemberhip = await ctx.db
			.query("institutionMember")
			.withIndex("userId", (q) => q.eq("userId", args.userId))
			.first();

		if (!institutionMemberhip) return null;

		const institution = await ctx.db
			.query("institution")
			.withIndex("by_id", (q) =>
				q.eq("_id", institutionMemberhip.organizationId as Id<"institution">),
			)
			.first();

		return institution;
	},
});

/**
 * **List all institutions by given user and role**
 * @param userId
 * @param role
 */
export const listByUserRole = query({
	args: { userId: vv.string(), role: vv.string() },
	returns: vv.array(vv.doc("institution")),
	handler: async (ctx, args) => {
		const institutionMemberhips = await ctx.db
			.query("institutionMember")
			.withIndex("by_role_user", (q) =>
				q.eq("role", args.role).eq("userId", args.userId),
			)
			.take(10);

		const institutionsList: Doc<"institution">[] = [];

		for (const membership of institutionMemberhips) {
			const institution = await ctx.db
				.query("institution")
				.withIndex("by_id", (q) =>
					q.eq("_id", membership.organizationId as Id<"institution">),
				)
				.first();

			if (institution) institutionsList.push(institution);
		}

		return institutionsList;
	},
});
