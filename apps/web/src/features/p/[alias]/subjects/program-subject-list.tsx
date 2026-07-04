"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
import { Button } from "@instello/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@instello/ui/components/dropdown-menu";
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
import {
	IconAlertCircle,
	IconBooks,
	IconDots,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { SubjectAvatar } from "@/features/subjects/subject-avatar";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { SubjectTypeBadge } from "./subject-type-badge";

function ProgramSubjectListSkeleton({ count }: { count: number }) {
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

function ProgramSubjectListEmpty({
	stageName,
	onAllocate,
}: {
	stageName: string;
	onAllocate: () => void;
}) {
	return (
		<Empty className="border border-border min-h-72 border-dashed">
			<EmptyMedia variant="icon">
				<IconBooks />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>No subjects allocated yet</EmptyTitle>
				<EmptyDescription>
					Allocate subjects from your institution catalog to{" "}
					<i className="text-foreground">{stageName}</i>.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={onAllocate} variant="outline">
					<IconPlus />
					New alloc
				</Button>
			</EmptyContent>
		</Empty>
	);
}

export function ProgramSubjectList({
	programId,
	academicStageId,
	stageName,
	onAllocate,
}: {
	programId: Id<"programs">;
	academicStageId: Id<"academicStages">;
	stageName: string;
	onAllocate: () => void;
}) {
	const items = useInsQuery(api.programSubjects.listByStage, {
		programId,
		academicStageId,
	});
	const removeAllocation = useInsMutation(api.programSubjects.remove);
	const [removeError, setRemoveError] = useState<string | null>(null);

	async function handleRemove(id: Id<"programSubjects">) {
		setRemoveError(null);

		try {
			await removeAllocation({ id });
		} catch (error) {
			setRemoveError(
				getConvexErrorMessage(error, "Failed to remove allocation"),
			);
		}
	}

	if (items === undefined) {
		return <ProgramSubjectListSkeleton count={5} />;
	}

	if (items.length === 0) {
		return (
			<ProgramSubjectListEmpty stageName={stageName} onAllocate={onAllocate} />
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{removeError && (
				<Alert variant="destructive">
					<IconAlertCircle />
					<AlertTitle>{removeError}</AlertTitle>
					<AlertDescription>Please try again.</AlertDescription>
				</Alert>
			)}

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
							<SubjectTypeBadge type={item.type} />
							<DropdownMenu>
								<DropdownMenuTrigger
									render={<Button variant="ghost" size="icon-sm" />}
								>
									<IconDots />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										variant="destructive"
										onClick={() => handleRemove(item._id)}
									>
										<IconTrash className="size-4" />
										Remove allocation
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</ItemActions>
					</Item>
				))}
			</ItemGroup>
		</div>
	);
}
