import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { getToken as getTokenFromHeaders } from "@convex-dev/better-auth/utils";

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

/** Resolves a Convex JWT from arbitrary request headers (e.g. Next.js proxy). */
export async function getTokenFromRequestHeaders(headers: Headers) {
	const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
	if (!siteUrl) {
		throw new Error("set NEXT_PUBLIC_CONVEX_SITE_URL in .env.local file");
	}

	const mutableHeaders = new Headers(headers);
	mutableHeaders.delete("content-length");
	mutableHeaders.delete("transfer-encoding");
	mutableHeaders.set("accept-encoding", "identity");

	const result = await getTokenFromHeaders(siteUrl, mutableHeaders);
	return result.token;
}
