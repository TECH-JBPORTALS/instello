import type { GenericCtx } from "@convex-dev/better-auth";
import { ConvexError } from "convex/values";
import * as insPermissions from "../../better-auth/ins-permissions";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { ERROR_CODES } from "./errors";

/**
 * Helper function to validate the sessionId exists convex identitiy and
 * @returns `session`
 *
 */
export const ensureSession = async (ctx: GenericCtx<DataModel>) => {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity?.sessionId)
		throw new ConvexError(ERROR_CODES.BASE.UNAUTHORIZED.message);

	const user = await ctx.runQuery(components.betterAuth.users.getById, {
		userId: identity.subject,
	});

	return {
		userId: identity.subject,
		id: identity.sessionId,
		activeInstitutionId: identity.activeInstitutionId,
		user,
	};
};

/**
 * Helper function to validate the `institution` and membership of current user to the institution exists
 * @returns `institution` and `membership`
 */
export const ensureInstitution = async (
	ctx: GenericCtx<DataModel>,
	slug: string,
	userId: string,
) => {
	const institution = await ctx.runQuery(
		components.betterAuth.institutions.getBySlug,
		{ slug },
	);

	if (!institution)
		throw new ConvexError(ERROR_CODES.BASE.UNAUTHORIZED.message);

	const membership = await ctx.runQuery(
		components.betterAuth.institutions.getMembership,
		{
			organizationId: institution._id,
			userId: userId,
		},
	);

	if (!membership)
		throw new ConvexError(
			ERROR_CODES.ORGANIZATION.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION.message,
		);

	return { institution, membership };
};

/**
 * Helper function to validate the permissions for given role in the institution
 * @param ctx
 * @param institutionId
 * @param permissions
 */
export const ensureInsPermission = async (
	role: insPermissions.InsRole,
	permissions: insPermissions.InsPermission[],
) => {
	const required = insPermissions.toPermissionObject(permissions);

	const statements = insPermissions.insRoles[role].statements;

	const hasAccess = insPermissions.hasPermission(statements, required);

	if (!hasAccess) throw new ConvexError(ERROR_CODES.BASE.ACCESS_DENIED.message);
};
