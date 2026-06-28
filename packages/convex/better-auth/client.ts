import { convexClient } from "@convex-dev/better-auth/client/plugins";
import {
	adminClient,
	inferOrgAdditionalFields,
	organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient, type ErrorContext } from "better-auth/react";
import type { auth } from "../functions/betterAuth/auth";
import * as InsPermissions from "./ins-permissions";
import * as UserPermissions from "./user-permissions";

export const authClient = createAuthClient({
	plugins: [
		adminClient({
			ac: UserPermissions.ac,
			roles: {
				superadmin: UserPermissions.superadmin,
				owner: UserPermissions.owner,
				user: UserPermissions.user,
			},
		}),
		organizationClient({
			schema: inferOrgAdditionalFields<typeof auth>(),
			ac: InsPermissions.ac,
			roles: {
				owner: InsPermissions.owner,
				principal: InsPermissions.principal,
				faculty: InsPermissions.faculty,
			},
		}),
		convexClient(),
	],
});

export type BetterAuthErrorContext = ErrorContext;
