"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { programPath } from "@/features/programs/program-path";
import { useProgramAlias } from "@/hooks/use-program-alias";

type ProgramLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
	segment?: string;
};

export function ProgramLink({ segment = "/", ...props }: ProgramLinkProps) {
	const alias = useProgramAlias();

	return <Link href={programPath(alias, segment)} {...props} />;
}
