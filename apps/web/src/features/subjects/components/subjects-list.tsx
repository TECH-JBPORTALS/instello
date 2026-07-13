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
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconCopy, IconPlus } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import Link from "next/link";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInsPaginatedQuery } from "@/hooks/convex-react";
import { SUBJECT_LIST_PAGE_SIZE } from "../constants";
import { subjectPath } from "../subject-path";
import { NewSubjectDialog } from "./new-subject-dialog";
import { SubjectAvatar } from "./subject-avatar";

function SubjectsListEmpty({ searchQuery }: { searchQuery: string }) {
	const [open, setOpen] = useState(false);

	return (
		<Empty className="border border-border min-h-72 border-dashed">
			<EmptyMedia variant={"icon"}>
				<IconCopy />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>
					{searchQuery.trim() ? "No subjects found" : "No subjects found"}
				</EmptyTitle>
				<EmptyDescription>
					{searchQuery.trim()
						? "Try a different search term."
						: "Subjects are courses taught across programs in your institution."}
				</EmptyDescription>
			</EmptyHeader>
			{!searchQuery.trim() && (
				<EmptyContent>
					<Button onClick={() => setOpen(true)} variant={"outline"}>
						<IconPlus />
						Add new subject
					</Button>
				</EmptyContent>
			)}
			<NewSubjectDialog open={open} setOpen={setOpen} />
		</Empty>
	);
}

function SubjectsListSkeleton({ count }: { count: number }) {
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
				</Item>
			))}
		</div>
	);
}

export function SubjectsList({ searchQuery }: { searchQuery: string }) {
	const trimmedQuery = searchQuery.trim();
	const { results, status, loadMore, isLoading } = useInsPaginatedQuery(
		api.subject.queries.list,
		{ query: trimmedQuery || undefined },
		{ initialNumItems: SUBJECT_LIST_PAGE_SIZE },
	);

	if (status === "LoadingFirstPage") {
		return <SubjectsListSkeleton count={8} />;
	}

	if (isEmpty(results)) {
		return <SubjectsListEmpty searchQuery={searchQuery} />;
	}

	return (
		<InfiniteScroll
			dataLength={results.length}
			next={() => loadMore(SUBJECT_LIST_PAGE_SIZE)}
			hasMore={status === "CanLoadMore"}
			loader={<SubjectsListSkeleton count={3} />}
		>
			<ItemGroup className="bg-card">
				{results.map((subject) => (
					<Item
						key={subject._id}
						className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
						render={<Link href={subjectPath(subject.alias)} />}
					>
						<ItemMedia variant={"image"}>
							<SubjectAvatar name={subject.name} color={subject.color} />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>{subject.name}</ItemTitle>
							<ItemDescription className="uppercase">
								{subject.code}
							</ItemDescription>
						</ItemContent>
					</Item>
				))}
				{isLoading && <SubjectsListSkeleton count={3} />}
			</ItemGroup>
		</InfiniteScroll>
	);
}
