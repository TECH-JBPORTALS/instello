"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
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
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconPlus, IconUsersGroup } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInsPaginatedQuery } from "@/hooks/convex-react";
import { CLASS_LIST_PAGE_SIZE } from "./constants";
import { NewClassDialog } from "./new-class-dialog";
import { ClassAvatar } from "./class-avatar";

function ClassesListEmpty({
	searchQuery,
	programId,
}: {
	searchQuery: string;
	programId: Id<"programs">;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Empty className="border border-border min-h-72 border-dashed">
			<EmptyMedia variant={"icon"}>
				<IconUsersGroup />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>
					{searchQuery.trim() ? "No classes found" : "No classes yet"}
				</EmptyTitle>
				<EmptyDescription>
					{searchQuery.trim()
						? "Try a different search term."
						: "Classes are student batches progressing through your academic pattern stages."}
				</EmptyDescription>
			</EmptyHeader>
			{!searchQuery.trim() && (
				<EmptyContent>
					<Button onClick={() => setOpen(true)} variant={"outline"}>
						<IconPlus />
						Add new class
					</Button>
				</EmptyContent>
			)}
			<NewClassDialog open={open} setOpen={setOpen} programId={programId} />
		</Empty>
	);
}

function ClassesListSkeleton({ count }: { count: number }) {
	return (
		<div className="rounded-lg border shadow-xs">
			{Array.from({ length: count }).map((_, i) => (
				<Item
					key={i}
					className="border-x-0 border-t-0 hover:bg-accent/50 last:border-b-0 rounded-none border-border!"
				>
					<ItemContent className="space-y-2.5">
						<Skeleton className="h-3 w-32" />
						<Skeleton className="h-2 w-48" />
					</ItemContent>
				</Item>
			))}
		</div>
	);
}

export function ClassesList({
	searchQuery,
	programId,
}: {
	searchQuery: string;
	programId: Id<"programs">;
}) {
	const trimmedQuery = searchQuery.trim();
	const { results, status, loadMore, isLoading } = useInsPaginatedQuery(
		api.classes.list,
		{
			programId,
			searchQuery: trimmedQuery || undefined,
		},
		{ initialNumItems: CLASS_LIST_PAGE_SIZE },
	);

	if (status === "LoadingFirstPage") {
		return <ClassesListSkeleton count={8} />;
	}

	if (isEmpty(results)) {
		return <ClassesListEmpty searchQuery={searchQuery} programId={programId} />;
	}

	return (
		<InfiniteScroll
			dataLength={results.length}
			next={() => loadMore(CLASS_LIST_PAGE_SIZE)}
			hasMore={status === "CanLoadMore"}
			loader={<ClassesListSkeleton count={3} />}
		>
			<ItemGroup className="bg-card">
				{results.map((cls) => (
					<Item
						key={cls._id}
						className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
					>
						<ItemMedia>
							<ClassAvatar />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>{cls.name}</ItemTitle>
							<ItemDescription>
								{cls.currentHeadStage.name} ·{" "}
								<span className="text-muted-foreground uppercase">
									{cls.currentHeadStage.alias}
								</span>
								{cls.description ? ` — ${cls.description}` : ""}
							</ItemDescription>
						</ItemContent>
					</Item>
				))}
				{isLoading && <ClassesListSkeleton count={3} />}
			</ItemGroup>
		</InfiniteScroll>
	);
}
