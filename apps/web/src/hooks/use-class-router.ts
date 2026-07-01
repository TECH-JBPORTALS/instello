"use client";

import { useRouter } from "next/navigation";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { classPath } from "@/lib/class-path";

export function useClassRouter() {
	const router = useRouter();
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();

	const path = (segment = "/") => classPath(programAlias, classSlug, segment);
	const push = (segment = "/") => router.push(path(segment));
	const replace = (segment = "/") => router.replace(path(segment));

	return { path, push, replace, programAlias, classSlug };
}
