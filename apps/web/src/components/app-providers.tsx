"use client";

import { ConvexBetterAuthClientProvider } from "@instello/convex/better-auth/provider";
import { TooltipProvider } from "@instello/ui/components/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import type { ColorScheme } from "@/features/settings/theme-config";
import { ColorSchemeProvider } from "@/providers/color-scheme-provider";
import { ThemeProvider } from "@/providers/theme-provider";

export function AppProviders({
	children,
	initialToken,
	initialColorScheme,
}: {
	children: React.ReactNode;
	initialToken?: string;
	initialColorScheme: ColorScheme;
}) {
	return (
		<NuqsAdapter>
			<ThemeProvider>
				<ColorSchemeProvider initialColorScheme={initialColorScheme}>
					<TooltipProvider>
						<ConvexBetterAuthClientProvider initialToken={initialToken}>
							{children}
							<Toaster richColors position="top-center" />
						</ConvexBetterAuthClientProvider>
					</TooltipProvider>
				</ColorSchemeProvider>
			</ThemeProvider>
		</NuqsAdapter>
	);
}
