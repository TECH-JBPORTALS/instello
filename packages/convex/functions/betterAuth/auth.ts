import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins/organization";
import { components } from "~/_generated/api";
import type { DataModel } from "~/_generated/dataModel";
import authConfig from "~/auth.config";
import { ac, owner, principal, faculty } from "~/permissions";

const siteUrl = process.env.SITE_URL;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			disableSignUp: true,
		},
		plugins: [
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
					invitation: { modelName: "institutionInvitations" },
				},
				/** Number of institutions owner can create in his organization */
				organizationLimit: 10,
				cancelPendingInvitationsOnReInvite: true,
			}),
			convex({ authConfig }),
		],
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};
