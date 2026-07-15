import { ERROR_CODES, throwAppError } from "../helpers/constants";
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
		if (!institution)
			throwAppError(ERROR_CODES.ORGANIZATION.ORGANIZATION_NOT_FOUND);
		return institution;
	},
});

/**
 * Get an institution by slug
 * @returns null if no institution exists
 */
export const getBySlug = query({
	args: { slug: vv.string() },
	returns: vv.nullable(vv.doc("institution")),
	async handler(ctx, args) {
		return await ctx.db
			.query("institution")
			.withIndex("slug", (q) => q.eq("slug", args.slug))
			.first();
	},
});

/**
 * Get a institution by code
 * @returns null if no institution exists
 */
export const getByCode = query({
	args: { code: vv.string() },
	returns: vv.nullable(vv.doc("institution")),
	async handler(ctx, args) {
		const institution = await ctx.db
			.query("institution")
			.withIndex("code", (q) => q.eq("code", args.code))
			.first();

		return institution;
	},
});

/** Get user's membership record to given institution */
export const getMembership = query({
	args: { userId: vv.string(), organizationId: vv.string() },
	returns: vv.nullable(vv.object({ role: vv.string() })),
	handler: async (ctx, args) => {
		const membership = await ctx.db
			.query("institutionMember")
			.withIndex("by_organization_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", args.userId),
			)
			.first();

		if (!membership) return null;

		return { role: membership.role };
	},
});

/** Get first institution by user */
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

/** List all institutions by given user and role */
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
