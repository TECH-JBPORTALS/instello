import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import {
	isMutationCtx,
	requireActionCtx,
	requireRunMutationCtx,
} from "@convex-dev/better-auth/utils";
import {
	BetterAuthError,
	type BetterAuthOptions,
	betterAuth,
} from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import * as InsPermissions from "../better-auth/ins-permissions";
import * as UserPermissions from "../better-auth/user-permissions";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { env } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";
import * as Faculty from "./faculty/model/faculty";
import { ERROR_CODES, RESERVED_SUBDOMAINS } from "./helpers/constants";

const siteUrl = env.SITE_URL;
const betterAuthSecret = env.BETTER_AUTH_SECRET;

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
			allowedHosts: ["*.localtest.me:3000", "*.instello.in", "*.vercel.app"],
			fallback: siteUrl,
		},
		trustedOrigins: ["*.localtest.me:3000", "*.instello.in", "*.vercel.app"],
		secret: betterAuthSecret,
		database: authComponent.adapter(ctx),
		advanced: {
			// Let Convex generate document IDs. Required so organization
			// invitations don't send a pre-generated `_id` that fails adapter:create.
			// See: https://github.com/get-convex/better-auth/issues/407
			database: { generateId: false },
			crossSubDomainCookies: {
				enabled: true,
				domain:
					env.NODE_ENV === "development"
						? ".localtest.me"
						: env.NODE_ENV === "production"
							? ".instello.in"
							: ".vercel.app",
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
					organization: {
						modelName: "institution",
						additionalFields: {
							code: {
								type: "string",
								fieldName: "code",
								required: true,
								returned: true,
							},
							addressLine: {
								type: "string",
								fieldName: "addressLine",
								required: true,
								returned: true,
							},
							district: {
								type: "string",
								fieldName: "district",
								required: true,
								returned: true,
							},
							state: {
								type: "string",
								fieldName: "state",
								required: true,
								returned: true,
							},
							country: {
								type: "string",
								required: true,
								defaultValue: "India",
								input: false,
							},
							zipCode: {
								type: "string",
								fieldName: "zipCode",
								required: true,
								returned: true,
							},
						},
					},
					/** Represents institution members - AKA faculty */
					member: { modelName: "institutionMember" },
					/** Represents institution invitations - faculty invitations to join the institution*/
					invitation: { modelName: "institutionInvitation" },
				},
				/** Number of institutions owner can create in his organization */
				organizationLimit: 10,
				cancelPendingInvitationsOnReInvite: true,
				// With generateId: false, Better Auth defaults this to true.
				// Match emailAndPassword.requireEmailVerification: false.
				requireEmailVerificationOnInvitation: false,

				/** Send invitation email to the user when being invited to join an institution */
				async sendInvitationEmail(data) {
					const actionCtx = requireActionCtx(ctx);
					await actionCtx.runAction(internal.emails.sendInvitationEmail, {
						email: data.email,
						institutionName: data.organization.name,
						invitedByEmail: data.inviter.user.email,
						invitedByName: data.inviter.user.name,
						role: data.role as "faculty" | "principal",
						token: data.id,
					});
				},
				organizationHooks: {
					async beforeCreateOrganization(data) {
						if (RESERVED_SUBDOMAINS.has(data.organization.code))
							throw new BetterAuthError(
								ERROR_CODES.BASE.INSITUTION_SLUG_RESERVED.message,
							);

						const ins = await ctx.runQuery(
							components.betterAuth.institutions.getByCode,
							{ code: data.organization.code },
						);

						if (ins)
							throw new BetterAuthError(
								ERROR_CODES.BASE.INSITUTION_CODE_ALREADY_EXISTS.message,
							);

						return { data };
					},
					async afterAcceptInvitation({ invitation, user, organization }) {
						if (isMutationCtx(ctx)) {
							await Faculty.activateFromInvitation(ctx, {
								institutionId: organization.id,
								email: invitation.email,
								userId: user.id,
							});
							return;
						}

						const runMutationCtx = requireRunMutationCtx(ctx);
						await runMutationCtx.runMutation(
							internal.faculty.mutations.activateFromInvitation,
							{
								institutionId: organization.id,
								email: invitation.email,
								userId: user.id,
							},
						);
					},
					async afterCancelInvitation({ invitation, organization }) {
						if (isMutationCtx(ctx)) {
							await Faculty.revertToDraftFromInvitationCancellation(ctx, {
								institutionId: organization.id,
								email: invitation.email,
							});
							return;
						}

						const runMutationCtx = requireRunMutationCtx(ctx);
						await runMutationCtx.runMutation(
							internal.faculty.mutations
								.revertToDraftFromInvitationCancellation,
							{
								institutionId: organization.id,
								email: invitation.email,
							},
						);
					},
				},
			}),
			convex({
				authConfig,
				jwt: {
					expirationSeconds: 60 * 30, // 30 minutes

					/* This payload defines the jwt session passed to the convex funtions context
					 * WARNING: Be careful when your modifying this part, think twice.
					 * extended `UserIdentity` interface are placed in globals.d.ts
					 */
					definePayload: ({ user, session }) => {
						return {
							name: user.name,
							email: user.email,
							activeInstitutionId: session.activeOrganizationId,
						};
					},
				},
			}),
		],
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};
