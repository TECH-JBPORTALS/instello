"use client";

import { authClient } from "@instello/convex/better-auth/client";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function useSyncActiveInstitution() {
	const { subdomain } = useParams<{ subdomain: string }>();
	const { data: activeOrg } = authClient.useActiveOrganization();
	const syncingRef = useRef<string | null>(null);

	useEffect(() => {
		if (!subdomain || activeOrg?.slug === subdomain) return;
		if (syncingRef.current === subdomain) return;
		syncingRef.current = subdomain;

		void authClient.organization
			.setActive({ organizationSlug: subdomain })
			.finally(() => {
				if (syncingRef.current === subdomain) syncingRef.current = null;
			});
	}, [subdomain, activeOrg?.slug]);
}
