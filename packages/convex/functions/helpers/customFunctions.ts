import {
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import { components } from "~/_generated/api";
import { mutation, query } from "~/_generated/server";
import { requireSession } from "./auth";

/**
 * user-scoped query which validates session before proceeding with the query handler
 * @param ctx - the context object contains extra resolved logged-in user document
 */
export const userQuery = customQuery(query, {
	args: {},
	async input(ctx) {
		const userId = await requireSession(ctx);

		const user = await ctx.runQuery(components.betterAuth.users.get, {
			userId,
		});

		return { ctx: { ...ctx, user }, args: {} };
	},
});

/**
 * user-scoped mutation which validates session before proceeding with the mutation handler
 * @param ctx - the context object contains extra resolved logged-in user document
 */
export const userMutation = customMutation(mutation, {
	args: {},
	async input(ctx) {
		const userId = await requireSession(ctx);

		const user = await ctx.runQuery(components.betterAuth.users.get, {
			userId,
		});

		return { ctx: { ...ctx, user }, args: {} };
	},
});
