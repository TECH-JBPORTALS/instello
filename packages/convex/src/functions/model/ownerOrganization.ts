import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import * as AcademicPattern from "../academicPattern/model/academicPattern";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const OwnerOrgCreateSchema = vv
	.doc("ownerOrganizations")
	.omit("_creationTime", "_id", "createdAt", "updatedAt", "ownerId");

export const OwnerOrgSchema = vv
	.doc("ownerOrganizations")
	.omit("_creationTime", "_id", "createdAt", "updatedAt");

export const OwnerOrgUpdateSchema = vv
	.doc("ownerOrganizations")
	.omit("_creationTime", "_id", "createdAt", "updatedAt", "ownerId", "slug");

export const OwnerOrgPatchSchema = vv.object({
	name: vv.optional(vv.string()),
	addressLine: vv.optional(vv.string()),
	city: vv.optional(vv.string()),
	state: vv.optional(vv.string()),
	postalCode: vv.optional(vv.string()),
	country: vv.optional(vv.string()),
});

/** Create organization for owner */
export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof OwnerOrgCreateSchema> & { ownerId: string },
) {
	const orgId = await ctx.db.insert("ownerOrganizations", {
		...args,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	await AcademicPattern.seedDefaults(ctx, orgId);

	return orgId;
}

/** Update owner organization fields (slug is not editable) */
export async function patch(
	ctx: AppMutationCtx,
	id: Id<"ownerOrganizations">,
	body: Infer<typeof OwnerOrgPatchSchema>,
) {
	await ctx.db.patch("ownerOrganizations", id, {
		...body,
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
