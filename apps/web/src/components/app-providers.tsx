"use client";

import { ConvexBetterAuthClientProvider } from "@instello/convex/better-auth/provider";
import { TooltipProvider } from "@instello/ui/components/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export function AppProviders({
	children,
	initialToken,
}: {
	children: React.ReactNode;
	initialToken?: string;
}) {
	return (
		<NuqsAdapter>
			<TooltipProvider>
				<ConvexBetterAuthClientProvider initialToken={initialToken}>
					{children}
				</ConvexBetterAuthClientProvider>
			</TooltipProvider>
		</NuqsAdapter>
	);
}
