"use client";

import { api } from "@instello/convex/api";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useParams } from "next/navigation";

export function useCanManageFaculty() {
	const { subdomain } = useParams<{ subdomain: string }>();
	const context = useQuery(
		api.institutionMembers.getMyInstitutionContext,
		subdomain ? { slug: subdomain } : "skip",
	);

	if (!context) return false;

	return context.role === "owner" || context.role === "principal";
}
