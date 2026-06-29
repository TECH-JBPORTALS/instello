import type { Infer } from "convex/values";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const OwnerOrgSchema = vv
	.doc("ownerOrganizations")
	.omit("_creationTime", "_id", "createdAt", "updatedAt");

/** Create organization for owner */
export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof OwnerOrgSchema>,
) {
	return await ctx.db.insert("ownerOrganizations", {
		...args,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});
}

/** Get owner organization by current user */
export async function getByUserId(ctx: AppQueryCtx, args: { userId: string }) {
	const organization = await ctx.db
		.query("ownerOrganizations")
		.withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
		.first();

	if (!organization) return null;

	return organization;
}
