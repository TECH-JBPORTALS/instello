import "./globals.css";
import { getToken } from "@instello/convex/better-auth/server";
import { cn } from "@instello/ui/lib/utils";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";

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

	return (
		<html lang="en" className={cn("font-sans", sourceSans3.variable)}>
			<body className={cn(sourceSans3.variable)}>
				<Providers initialToken={token}>{children}</Providers>
			</body>
		</html>
	);
}
