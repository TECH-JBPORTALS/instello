"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
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
import { IconBooks } from "@tabler/icons-react";
import { SubjectTypeBadge } from "@/features/program-subjects/components/subject-type-badge";
import { SubjectAvatar } from "@/features/subjects/components/subject-avatar";
import { useInsQuery } from "@/hooks/convex-react";
import { AssignSubjectFacultyPopover } from "./assign-subject-faculty-popover";

function ClassSubjectListSkeleton({ count }: { count: number }) {
	return (
		<div className="rounded-lg border shadow-xs">
			{Array.from({ length: count }).map((_, i) => (
				<Item
					key={i}
					className="border-x-0 border-t-0 hover:bg-accent/50 last:border-b-0 rounded-none border-border!"
				>
					<ItemMedia variant="image">
						<Skeleton className="size-10 rounded-lg" />
					</ItemMedia>
					<ItemContent className="space-y-2.5">
						<Skeleton className="h-3 w-32" />
						<Skeleton className="h-2 w-48" />
					</ItemContent>
				</Item>
			))}
		</div>
	);
}

function ClassSubjectListEmpty({ stageName }: { stageName: string }) {
	return (
		<Empty className="border border-border min-h-72 border-dashed">
			<EmptyMedia variant="icon">
				<IconBooks />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>No subjects for this class yet</EmptyTitle>
				<EmptyDescription>
					Allocate subjects to <i className="text-foreground">{stageName}</i>{" "}
					from the program subjects page, then assign faculty here.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

export function ClassSubjectList({
	classId,
	stageName,
}: {
	classId: Id<"classes">;
	stageName: string;
}) {
	const items = useInsQuery(api.class.queries.listSubjects, { classId });

	if (items === undefined) {
		return <ClassSubjectListSkeleton count={5} />;
	}

	if (items.length === 0) {
		return <ClassSubjectListEmpty stageName={stageName} />;
	}

	return (
		<ItemGroup className="bg-card">
			{items.map((item) => (
				<Item
					key={item._id}
					className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 rounded-none border-border!"
				>
					<ItemMedia variant="image">
						<SubjectAvatar
							name={item.subject.name}
							color={item.subject.color}
						/>
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{item.subject.name}</ItemTitle>
						<ItemDescription className="uppercase">
							{item.subject.code}
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<AssignSubjectFacultyPopover
							classId={classId}
							programSubjectId={item._id}
							assigned={item.faculty}
						/>
						<SubjectTypeBadge type={item.type} />
					</ItemActions>
				</Item>
			))}
		</ItemGroup>
	);
}
