"use client";

import { ConvexBetterAuthClientProvider } from "@instello/convex/better-auth/provider";
import { TooltipProvider } from "@instello/ui/components/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

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
					<Toaster richColors position="top-center" />
				</ConvexBetterAuthClientProvider>
			</TooltipProvider>
		</NuqsAdapter>
	);
}
