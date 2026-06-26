import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import * as InsPermissions from "~/institution-permissions";
import * as UserPermissions from "~/user-permissions";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import authSchema, { vv } from "./betterAuth/schema";
import { userQuery } from "./helpers/customFunctions";
import { formInstitutionUrl } from "./helpers/utils";
import * as OwnerOrganizations from "./model/ownerOrganization";

const siteUrl = process.env.SITE_URL;
// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(
	components.betterAuth,
	{
		local: { schema: authSchema },
		verbose: false,
	},
);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		baseURL: {
			allowedHosts: ["*.localtest.me", "*.vercel.app"],
			fallback: siteUrl,
		},
		database: authComponent.adapter(ctx),
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
				domain: ".localtest.me",
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		databaseHooks: {
			session: {
				create: {
					/* Set first intitution id to the session before creating the new session 
					- So user no need to select any prior institution once they authenticated */
					before: async (session) => {
						const firstInstitution = await ctx.runQuery(
							components.betterAuth.institutions.firstByUser,
							{ userId: session.userId },
						);

						return {
							data: { ...session, activeInstitutionId: firstInstitution?._id },
						};
					},
				},
			},
		},
		plugins: [
			admin({
				adminRoles: ["superadmin"],
				ac: UserPermissions.ac,
				roles: {
					superadmin: UserPermissions.superadmin,
					owner: UserPermissions.owner,
					user: UserPermissions.user,
				},
			}),
			organization({
				ac: InsPermissions.ac,
				roles: {
					owner: InsPermissions.owner,
					principal: InsPermissions.principal,
					faculty: InsPermissions.faculty,
				},
				schema: {
					/** Represents institution */
					organization: { modelName: "institution" },
					/** Represents institution members - AKA faculty */
					member: { modelName: "institutionMember" },
					/** Represents institution invitations - faculty invitations to join the institution*/
					invitation: { modelName: "institutionInvitation" },
					session: {
						fields: { activeOrganizationId: "activeInstitutionId" },
					},
				},
				/** Number of institutions owner can create in his organization */
				organizationLimit: 10,
				cancelPendingInvitationsOnReInvite: true,
				organizationHooks: {},
			}),
			convex({
				authConfig,
				jwt: {
					expirationSeconds: 60 * 30, // 30 minutes

					/* This payload defines the jwt session passed to the convex funtions context
					 * WARNING: Be careful when your modifying this part, think twice.
					 * extended `UserIdentity` interface are placed in globals.d.ts
					 */
					definePayload: ({ user, session }) => ({
						name: user.name,
						email: user.email,
						sesionId: session.id,
						activeInstitutionId: session.activeInstitutionId,
					}),
				},
			}),
		],
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};

export const resolveLandingPath = userQuery({
	args: {},
	returns: {
		redirectUrl: vv.string(),
	},
	handler: async (ctx) => {
		const user = await ctx.runQuery(components.betterAuth.users.getById, {
			userId: ctx.session.userId,
		});

		if (user.role === "owner") {
			const organization = await OwnerOrganizations.getByUserId(ctx, {
				userId: ctx.session.userId,
			});

			return {
				redirectUrl: organization
					? `/${organization.slug}`
					: "/owner/onboarding",
			};
		}

		if (ctx.session.activeInstitutionId) {
			const institution = await ctx.runQuery(
				components.betterAuth.institutions.getById,
				{
					id: ctx.session.activeInstitutionId,
				},
			);

			return {
				redirectUrl: institution
					? formInstitutionUrl(institution.slug)
					: "/institution-not-found",
			};
		}

		return {
			redirectUrl: "/not-part-of-any-institution",
		};
	},
});
