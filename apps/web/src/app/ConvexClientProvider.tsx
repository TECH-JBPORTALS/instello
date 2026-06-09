"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl)
	throw new Error("Missing NEXT_PUBLIC_CONVEX_URL for the web Convex client");

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
	children,
}: {
	children: ReactNode;
}) {
	return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
