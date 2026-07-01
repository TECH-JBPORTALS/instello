"use client";

import { useParams, usePathname } from "next/navigation";
import { getProgramAliasFromPath } from "@/lib/sidebar-mode";

export function useProgramAlias() {
	const params = useParams<{ alias?: string }>();
	const pathname = usePathname();

	return params.alias ?? getProgramAliasFromPath(pathname) ?? "";
}
