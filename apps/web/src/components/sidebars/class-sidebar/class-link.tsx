"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { classPath } from "@/lib/class-path";

type ClassLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
	segment?: string;
};

export function ClassLink({ segment = "/", ...props }: ClassLinkProps) {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();

	return <Link href={classPath(programAlias, classSlug, segment)} {...props} />;
}
