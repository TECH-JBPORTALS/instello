import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { components } from "~/_generated/api";
import type { DataModel } from "~/_generated/dataModel";
import authConfig from "~/auth.config";
import { ac, faculty, owner, principal } from "~/permissions";
import schema from "./schema";

const siteUrl = process.env.SITE_URL;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof schema>(
	components.betterAuth,
	{
		local: { schema },
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
		user: {
			modelName: "users",
		},
		session: {
			modelName: "sessions",
		},
		account: {
			modelName: "accounts",
		},
		verification: {
			modelName: "verifications",
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
					organization: { modelName: "institutions" },
					/** Represents institution members - AKA faculty */
					member: { modelName: "institutionMembers" },
					/** Represents institution invitations - faculty invitations to join the institution*/
					invitation: { modelName: "institutionInvitations" },
					session: {
						fields: { activeOrganizationId: "activeInstitutionId" },
					},
				},
				/** Number of institutions owner can create in his organization */
				organizationLimit: 10,
				cancelPendingInvitationsOnReInvite: true,
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
