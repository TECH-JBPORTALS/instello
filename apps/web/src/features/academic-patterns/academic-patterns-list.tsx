"use client";

import { api } from "@instello/convex/api";
import {
	Empty,
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
import { IconCalendarEvent } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { isEmpty, isUndefined } from "lodash";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatPatternSummary } from "./constants";
import { PatternAvatar } from "./pattern-avatar";
import { LockBadge, TemplateBadge } from "./pattern-badges";
import { academicPatternPath } from "./pattern-path";

function AcademicPatternsListSkeleton({ count }: { count: number }) {
	return (
		<div className="rounded-lg border shadow-xs">
			{Array.from({ length: count }).map((_, i) => (
				<Item
					key={i}
					className="rounded-none border-x-0 border-t-0 border-border! last:border-b-0 hover:bg-accent/50"
				>
					<ItemMedia variant="image">
						<Skeleton className="size-10 rounded-lg" />
					</ItemMedia>
					<ItemContent className="space-y-2.5">
						<Skeleton className="h-3 w-32" />
						<Skeleton className="h-2 w-56" />
					</ItemContent>
					<ItemActions>
						<Skeleton className="h-5 w-16 rounded-full" />
					</ItemActions>
				</Item>
			))}
		</div>
	);
}

function AcademicPatternsListEmpty() {
	return (
		<Empty className="min-h-72 border border-border border-dashed">
			<EmptyMedia variant="icon">
				<IconCalendarEvent />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>No academic patterns found</EmptyTitle>
				<EmptyDescription>
					Academic patterns define semester or annual structures for your
					institutions.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

export function AcademicPatternsList() {
	const { orgSlug } = useParams<{ orgSlug: string }>();
	const patterns = useQuery(api.academicPatterns.list);

	if (isUndefined(patterns)) {
		return <AcademicPatternsListSkeleton count={4} />;
	}

	if (isEmpty(patterns)) return <AcademicPatternsListEmpty />;

	return (
		<ItemGroup className="bg-card">
			{patterns.map((pattern) => (
				<Item
					key={pattern._id}
					className="relative rounded-none border-x-0 border-t-0 border-border! last:border-b-0 hover:bg-accent/30"
					render={<Link href={academicPatternPath(orgSlug, pattern._id)} />}
				>
					<ItemMedia variant="image">
						<PatternAvatar name={pattern.name} />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{pattern.name}</ItemTitle>
						<ItemDescription>
							{formatPatternSummary(
								pattern.systemType,
								pattern.durationInYears,
								pattern.stageCount,
							)}
						</ItemDescription>
					</ItemContent>
					<ItemActions className="flex items-center gap-2">
						<TemplateBadge templateKey={pattern.templateKey} />
						<LockBadge locked={!pattern.canBeEdited} />
					</ItemActions>
				</Item>
			))}
		</ItemGroup>
	);
}
