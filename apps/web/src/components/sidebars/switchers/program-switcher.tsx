"use client";

import { api } from "@instello/convex/api";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Skeleton } from "@instello/ui/components/skeleton";
import { Spinner } from "@instello/ui/components/spinner";
import { useQuery } from "convex-helpers/react/cache";
import { isUndefined } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import { ProgramAvatar } from "@/features/programs/program-avatar";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { programPath } from "@/lib/program-path";
import { getProgramSegment, getSidebarMode } from "@/lib/sidebar-mode";

export function ProgramSwitcher() {
	const router = useRouter();
	const pathname = usePathname();
	const institutionSlug = useInstitutionSlug();
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const programs = useQuery(api.programs.list, { slug: institutionSlug });

	if (isUndefined(program) || isUndefined(programs)) {
		return (
			<Skeleton className="h-8 border w-auto text-xs text-muted-foreground flex items-center gap-2 px-2">
				<Spinner className="size-3" />
				Loading programs...
			</Skeleton>
		);
	}

	const currentSegment = getProgramSegment(pathname);

	return (
		<Select
			value={programAlias}
			onValueChange={(value) => {
				if (!value || value === "__all__") {
					router.push("/programs");
					return;
				}
				if (getSidebarMode(pathname) === "class") {
					router.push(programPath(value, "classes"));
					return;
				}
				router.push(
					currentSegment
						? programPath(value, currentSegment)
						: programPath(value),
				);
			}}
		>
			<SelectTrigger className="h-auto w-full py-2">
				<SelectValue>
					<span className="flex items-center gap-2">
						<ProgramAvatar name={program.name} size="sm" />
						<span className="flex min-w-0 flex-col items-start gap-0.5">
							<span className="truncate font-medium">{program.name}</span>
						</span>
					</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>All Programs</SelectLabel>
					{programs.map((item) => (
						<SelectItem className="truncate" key={item._id} value={item.alias}>
							<ProgramAvatar size="sm" name={item.name} />
							{item.name}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
