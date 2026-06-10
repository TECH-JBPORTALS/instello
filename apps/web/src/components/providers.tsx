"use client";

import { ConvexBetterAuthClientProvider } from "@instello/convex/better-auth/provider";
import { TooltipProvider } from "@instello/ui/components/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<ConvexBetterAuthClientProvider>
				{children}
			</ConvexBetterAuthClientProvider>
		</TooltipProvider>
	);
}
