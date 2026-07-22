import type { GenericCtx } from "@convex-dev/better-auth";
import * as insPermissions from "../../better-auth/ins-permissions";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";
import * as ProgramFaculty from "../program/model/programFaculty";
import { ERROR_CODES, throwAppError } from "./constants";

/**
 * Helper function to validate the sessionId exists convex identitiy and
 * @returns `session`
 *
 */
export const ensureSession = async (ctx: GenericCtx<DataModel>) => {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity?.sessionId) throwAppError(ERROR_CODES.BASE.UNAUTHORIZED);

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
		throwAppError(ERROR_CODES.ORGANIZATION.ORGANIZATION_NOT_FOUND);

	const membership = await ctx.runQuery(
		components.betterAuth.institutions.getMembership,
		{
			organizationId: institution._id,
			userId: userId,
		},
	);

	if (!membership)
		throwAppError(
			ERROR_CODES.ORGANIZATION.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION,
		);

	return { institution, membership };
};

/**
 * Helper function to validate the permissions for given role in the institution.
 * Faculty who are Head of Program (HOP) are elevated to principal statements.
 */
export const ensureInsPermission = async (
	ctx: { db: DatabaseReader },
	args: {
		role: insPermissions.InsRole;
		permissions: insPermissions.InsPermission[];
		institutionId: string;
		userId: string;
	},
) => {
	const required = insPermissions.toPermissionObject(args.permissions);
	const roleStatements = insPermissions.insRoles[args.role].statements;

	if (insPermissions.hasPermission(roleStatements, required)) {
		return;
	}

	if (args.role === "faculty") {
		const isHop = await ProgramFaculty.isHeadOfProgramForUser(
			ctx,
			args.institutionId,
			args.userId,
		);

		if (
			isHop &&
			insPermissions.hasPermission(
				insPermissions.insRoles.principal.statements,
				required,
			)
		) {
			return;
		}
	}

	throwAppError(ERROR_CODES.BASE.ACCESS_DENIED);
};
