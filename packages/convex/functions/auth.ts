import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { ac, faculty, owner, principal } from "~/permissions";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import authSchema, { vv } from "./betterAuth/schema";
import { userQuery } from "./helpers/customFunctions";
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
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
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
			admin(),
			organization({
				ac,
				roles: {
					owner,
					principal,
					faculty,
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

export const getUserResource = userQuery({
	args: {},
	returns: {
		role: vv.union(
			vv.literal("owner"),
			vv.literal("principal"),
			vv.literal("faculty"),
		),
		resourceSlug: vv.optional(vv.string()),
	},
	handler: async (ctx) => {
		const { headers, auth } = await authComponent.getAuth(createAuth, ctx);

		const { role } = await auth.api.getActiveMemberRole({ headers });

		if (role === "owner") {
			const organization = await OwnerOrganizations.getByUserId(ctx, {
				userId: ctx.session.userId,
			});

			return {
				role,
				resourceSlug: organization?.slug,
			};
		}

		return {
			role,
			resourceSlug: "some",
		};
	},
});
