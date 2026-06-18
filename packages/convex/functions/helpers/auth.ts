import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "~/_generated/dataModel";

/**
 * Helper function to validate the user identitiy and return the userId
 */
export const requireSession = async (ctx: GenericCtx<DataModel>) => {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		throw new Error("Unauthorized access");
	}

	return identity.subject;
};
