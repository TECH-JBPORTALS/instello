"use client";

import { useRouter } from "next/navigation";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { programPath } from "@/lib/program-path";

export function useProgramRouter() {
	const router = useRouter();
	const alias = useProgramAlias();

	const path = (segment = "/") => programPath(alias, segment);
	const push = (segment = "/") => router.push(path(segment));
	const replace = (segment = "/") => router.replace(path(segment));

	return { path, push, replace, alias };
}
