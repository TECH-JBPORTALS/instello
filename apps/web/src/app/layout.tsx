import "./globals.css";
import { TooltipProvider } from "@instello/ui/components/tooltip";
import { cn } from "@instello/ui/lib/utils";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import ConvexClientProvider from "./ConvexClientProvider";

const sourceSans3 = Source_Sans_3({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Notes App",
	description: "This is an app to take notes.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={cn("font-sans", sourceSans3.variable)}>
			<body className={cn(sourceSans3.variable)}>
				<TooltipProvider>
					<ConvexClientProvider>{children}</ConvexClientProvider>
				</TooltipProvider>
			</body>
		</html>
	);
}
