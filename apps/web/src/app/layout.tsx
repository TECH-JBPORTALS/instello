import "./globals.css";
import { getToken } from "@instello/convex/better-auth/server";
import { cn } from "@instello/ui/lib/utils";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/app-providers";
import {
	COLOR_SCHEME_COOKIE,
	parseColorScheme,
} from "@/features/settings/theme-config";

const sourceSans3 = Source_Sans_3({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Instello",
	description: "This is an app to manage your organization.",
	icons: {
		icon: "/favicon.ico",
	},
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const token = await getToken();
	const cookieStore = await cookies();
	const colorScheme = parseColorScheme(
		cookieStore.get(COLOR_SCHEME_COOKIE)?.value,
	);

	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn("font-sans", sourceSans3.variable)}
			{...(colorScheme !== "default" ? { "data-theme": colorScheme } : {})}
		>
			<body className={cn(sourceSans3.variable)}>
				{/* Seed next-themes storage from the cross-subdomain cookie before it
				    initializes, so the selected mode is shared across all subdomains. */}
				<script
					dangerouslySetInnerHTML={{
						__html: `try{var m=document.cookie.match(/(?:^|; )instello-theme=([^;]+)/);if(m){localStorage.setItem('theme',decodeURIComponent(m[1]));}}catch(e){}`,
					}}
				/>
				<AppProviders initialToken={token} initialColorScheme={colorScheme}>
					{children}
				</AppProviders>
			</body>
		</html>
	);
}
