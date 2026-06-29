import type { GenericCtx } from "@convex-dev/better-auth";
import { ConvexError } from "convex/values";
import * as insPermissions from "../../better-auth/ins-permissions";
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

	return {
		userId: identity.subject,
		name: identity.name,
		email: identity.email,
		id: identity.sessionId,
		activeInstitutionId: identity.activeInstitutionId,
	};
};

/**
 * Helper function to validate the `activeInstitutionId` exists in the convex identity and
 * @returns `activeInstitutionId`
 */
export const ensureInstitution = async (ctx: GenericCtx<DataModel>) => {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) throw new ConvexError(ERROR_CODES.BASE.UNAUTHORIZED.message);

	if (!identity.activeInstitutionId)
		throw new ConvexError(
			ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
		);

	return identity.activeInstitutionId;
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

	if (!hasAccess) throw new ConvexError(ERROR_CODES.BASE.ACCESS_DENIED);
};
