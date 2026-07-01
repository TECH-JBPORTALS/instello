"use client";

import { useParams, usePathname } from "next/navigation";
import { getClassSlugFromPath } from "@/lib/sidebar-mode";

export function useClassSlug() {
	const params = useParams<{ classSlug?: string }>();
	const pathname = usePathname();

	return params.classSlug ?? getClassSlugFromPath(pathname) ?? "";
}
