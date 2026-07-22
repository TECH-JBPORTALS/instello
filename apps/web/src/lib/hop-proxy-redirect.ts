import { api } from "@instello/convex/api";
import { getTokenFromRequestHeaders } from "@instello/convex/better-auth/server";
import { fetchQuery } from "convex/nextjs";
import type { NextRequest } from "next/server";
import { programPath } from "@/features/programs/program-path";

/**
 * Resolves the first HOP program path for the authenticated faculty member
 * on this institution subdomain. Returns null when the caller is not HOP
 * or when auth/query fails (caller should fall through).
 */
export async function resolveHopHomePath(
	request: NextRequest,
	subdomain: string,
): Promise<string | null> {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		return null;
	}

	try {
		const token = await getTokenFromRequestHeaders(request.headers);
		if (!token) {
			return null;
		}

		const user = await fetchQuery(
			api.users.getCurrentUserInInstitution,
			{ slug: subdomain },
			{ token, url: convexUrl },
		);

		if (user.role !== "faculty" || !user.isHeadOfProgram || !user.hopProgram) {
			return null;
		}

		return programPath(user.hopProgram.alias, "classes");
	} catch {
		return null;
	}
}
