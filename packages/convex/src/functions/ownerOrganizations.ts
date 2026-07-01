import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { userMutation, userQuery } from "./helpers/customFunctions";
import * as OwnerOrganization from "./model/ownerOrganization";
import { vv } from "./schema";

/**
 *  **Create organization for current user**
 *  @returns inserted ownerOrganization ID
 * */
export const create = userMutation({
	args: OwnerOrganization.OwnerOrgCreateSchema,
	returns: vv.id("ownerOrganizations"),
	handler: async (ctx, args) => {
		const existing = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (existing) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.ALREADY_EXISTS);
		}

		return await OwnerOrganization.create(ctx, {
			...args,
			ownerId: ctx.session.userId,
		});
	},
});

/**
 *  **Get organization attached to current user**
 *  @returns null if no organization is attached to current user
 * */
export const getByUser = userQuery({
	args: {},
	returns: vv.nullable(
		vv.object({
			_id: vv.id("ownerOrganizations"),
			name: vv.string(),
			slug: vv.string(),
		}),
	),
	handler: async (ctx) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) return null;

		return {
			_id: ownerOrg._id,
			name: ownerOrg.name,
			slug: ownerOrg.slug,
		};
	},
});
