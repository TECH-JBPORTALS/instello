"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconBlocks, IconPlus } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache";
import { isEmpty, isUndefined } from "lodash";
import Link from "next/link";
import { useState } from "react";
import { useInstitutionSlug } from "@/hooks/convex-react";
import { programPath } from "@/lib/program-path";
import { NewProgramDialog } from "./new-program-dialog";
import { ProgramAvatar } from "./program-avatar";

function ProgramsListEmpty() {
	const [open, setOpen] = useState(false);
	return (
		<Empty className="border border-border min-h-72 border-dashed">
			<EmptyMedia variant={"icon"}>
				<IconBlocks />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>No programs found</EmptyTitle>
				<EmptyDescription>
					Programs are courses provided inside an institution which students can
					enroll in.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={() => setOpen(true)} variant={"outline"}>
					<IconPlus />
					Add new program
				</Button>
			</EmptyContent>
			<NewProgramDialog open={open} setOpen={setOpen} />
		</Empty>
	);
}

function ProgramsListSkeleton({ count }: { count: number }) {
	return (
		<div className="rounded-lg border shadow-xs">
			{Array.from({ length: count }).map((_, i) => (
				<Item
					key={i}
					className="border-x-0 border-t-0 hover:bg-accent/50 last:border-b-0 rounded-none border-border!"
				>
					<ItemMedia variant={"image"}>
						<Skeleton className={"size-10 rounded-lg"} />
					</ItemMedia>
					<ItemContent className="space-y-2.5">
						<Skeleton className="h-3 w-22" />
						<Skeleton className="h-2 w-64" />
					</ItemContent>
					<ItemActions>
						<Skeleton className="size-6" />
					</ItemActions>
				</Item>
			))}
		</div>
	);
}

export function ProgramsList() {
	const institutionSlug = useInstitutionSlug();
	const programs = useQuery(api.programs.list, { slug: institutionSlug });

	if (isUndefined(programs)) return <ProgramsListSkeleton count={8} />;

	if (isEmpty(programs)) return <ProgramsListEmpty />;

	return (
		<ItemGroup className="bg-card">
			{programs.map((program) => (
				<Item
					key={program._id}
					className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
					render={<Link href={programPath(program.alias)} />}
				>
					<ItemMedia variant={"image"}>
						<ProgramAvatar name={program.name} />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{program.name}</ItemTitle>
						<ItemDescription className="uppercase">
							{program.alias}
						</ItemDescription>
					</ItemContent>
				</Item>
			))}
		</ItemGroup>
	);
}
