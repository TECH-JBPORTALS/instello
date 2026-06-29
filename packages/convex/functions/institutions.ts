import { components } from "./_generated/api";
import { userQuery } from "./helpers/customFunctions";
import * as Institution from "./model/institution";
import { vv } from "./schema";

/**
 * **List all institutions owned by the current user**
 * */
export const listMyOwned = userQuery({
	args: {},
	returns: vv.array(
		vv.object({
			_id: vv.string(),
			name: vv.string(),
			slug: vv.string(),
			logo: vv.optional(vv.union(vv.string(), vv.null())),
			code: vv.string(),
			addressLine: vv.string(),
			district: vv.string(),
			state: vv.string(),
			country: vv.string(),
			zipCode: vv.string(),
			createdAt: vv.number(),
		}),
	),
	handler: async (ctx) => {
		return await Institution.listByUserRole(ctx, {
			role: "owner",
			userId: ctx.session.userId,
		});
	},
});

/**
 * **Check if an institution code is available**
 */
export const checkCode = userQuery({
	args: { code: vv.string() },
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const code = args.code.trim();
		if (!code) return { available: false };

		const existing = await ctx.runQuery(
			components.betterAuth.institutions.getByCode,
			{ code },
		);

		return { available: existing === null };
	},
});
