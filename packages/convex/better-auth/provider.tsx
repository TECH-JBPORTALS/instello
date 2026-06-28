"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
	Authenticated,
	AuthLoading,
	ConvexReactClient,
	Unauthenticated,
} from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import type { ReactNode } from "react";
import { authClient } from "./client";

if (!process.env.NEXT_PUBLIC_CONVEX_URL)
	throw new Error("set NEXT_PUBLIC_CONVEX_URL in .env.local file");

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/** It is used to wrap the application and provide the Convex Better Auth client to the nextjs application*/
export function ConvexBetterAuthClientProvider({
	children,
	initialToken,
}: {
	children: ReactNode;
	initialToken?: string | null;
}) {
	return (
		<ConvexBetterAuthProvider
			client={convex}
			authClient={authClient}
			initialToken={initialToken}
		>
			<Authenticated>
				<ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
			</Authenticated>
			<AuthLoading>
				<div className="h-svh flex items-center justify-center w-full flex-col text-muted-foreground font-semibold">
					Loading your workspace...
				</div>
			</AuthLoading>
			<Unauthenticated>
				<div className="h-svh flex items-center justify-center w-full text-lg font-semibold">
					Unauthenticated, Please login
				</div>
			</Unauthenticated>
		</ConvexBetterAuthProvider>
	);
}
