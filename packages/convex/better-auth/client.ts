import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient, type ErrorContext } from "better-auth/react";
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
