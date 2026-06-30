import { RESERVED_SUBDOMAINS } from "@instello/convex/constants";
import { type NextRequest, NextResponse } from "next/server";
import { rootDomain } from "@/lib/utils";

function extractSubdomain(request: NextRequest): string | null {
	const host = request.headers.get("host") || "";
	const hostname = host.split(":")[0];

	// localhost / 127.0.0.1
	if (hostname === "localhost" || hostname === "127.0.0.1") {
		throw new Error(
			"Use localtest.me using Laravel Herd. If you not have install using this link: https://herd.laravel.com/download",
		);
	}

	// *.localtest.me
	if (hostname.endsWith(".localtest.me")) {
		return hostname.replace(".localtest.me", "");
	}

	// Handle vercel preview environment
	if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
		const parts = hostname.split("---");
		return parts.length > 0 ? parts[0] : null;
	}

	// Production
	if (hostname.endsWith(`.${rootDomain}`)) {
		return hostname.replace(`.${rootDomain}`, "");
	}

	return null;
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const subdomain = extractSubdomain(request);

	if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
		return NextResponse.next();
	}

	return NextResponse.rewrite(
		new URL(`/ins/${subdomain}${pathname}`, request.url),
	);
}

export const config = {
	matcher: [
		/*
		 * Match all paths except for:
		 * 1. /api routes
		 * 2. /_next (Next.js internals)
		 * 3. all root files inside /public (e.g. /favicon.ico)
		 */
		"/((?!api|_next|[\\w-]+\\.\\w+).*)",
	],
};
