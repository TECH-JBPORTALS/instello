import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

if (!process.env.NEXT_PUBLIC_CONVEX_URL)
	throw new Error("set NEXT_PUBLIC_CONVEX_URL in .env.local file");
if (!process.env.NEXT_PUBLIC_CONVEX_SITE_URL)
	throw new Error("set NEXT_PUBLIC_CONVEX_URL in .env.local file");

export const {
	handler,
	preloadAuthQuery,
	isAuthenticated,
	getToken,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthNextJs({
	convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
	convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
});
