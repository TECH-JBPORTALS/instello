"use client";

import { ConvexBetterAuthClientProvider } from "@instello/convex/better-auth/provider";
import { TooltipProvider } from "@instello/ui/components/tooltip";

export function Providers({
	children,
	initialToken,
}: {
	children: React.ReactNode;
	initialToken?: string;
}) {
	return (
		<TooltipProvider>
			<ConvexBetterAuthClientProvider initialToken={initialToken}>
				{children}
			</ConvexBetterAuthClientProvider>
		</TooltipProvider>
	);
}
