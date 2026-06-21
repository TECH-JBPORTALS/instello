import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient, type ErrorContext } from "better-auth/react";
import { ac, faculty, owner, principal } from "./permissions";

export const authClient = createAuthClient({
	plugins: [
		organizationClient({
			ac,
			roles: {
				owner,
				principal,
				faculty,
			},
		}),
		convexClient(),
	],
});

export type BetterAuthErrorContext = ErrorContext;
