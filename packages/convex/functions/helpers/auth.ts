import type { GenericCtx } from "@convex-dev/better-auth";
import { ConvexError } from "convex/values";
import type { DataModel } from "~/_generated/dataModel";
import { ERROR_CODES } from "./errors";

/**
 * Helper function to validate the user identitiy and return the userId
 */
export const requireSession = async (ctx: GenericCtx<DataModel>) => {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		throw new ConvexError(ERROR_CODES.UNAUTHORIZED.message);
	}

	return identity.subject;
};
