"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { programPath } from "@/lib/program-path";

type ProgramLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
	segment?: string;
};

export function ProgramLink({ segment = "/", ...props }: ProgramLinkProps) {
	const alias = useProgramAlias();

	return <Link href={programPath(alias, segment)} {...props} />;
}
