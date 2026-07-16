"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import { Card, CardContent } from "@instello/ui/components/card";
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
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconPlus, IconUser } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { FacultyAvatar } from "@/features/faculty/components/faculty-avatar";
import { programFacultyPath } from "@/features/faculty/faculty-path";
import { getFacultyDisplayName } from "@/features/faculty/forms/shared-form";
import { useInsPaginatedQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { cn } from "@/lib/utils";
import { PROGRAM_FACULTY_LIST_PAGE_SIZE } from "../constants";

type ProgramFacultyListProps = {
	programId: Id<"programs">;
	onAssign: () => void;
};

export function ProgramFacultyList({
	programId,
	onAssign,
}: ProgramFacultyListProps) {
	const programAlias = useProgramAlias();
	const {
		results,
		status: paginationStatus,
		loadMore,
		isLoading,
	} = useInsPaginatedQuery(
		api.program.queries.listFaculty,
		{ programId },
		{ initialNumItems: PROGRAM_FACULTY_LIST_PAGE_SIZE },
	);

	if (paginationStatus === "LoadingFirstPage") {
		return <ProgramFacultyListSkeleton count={8} />;
	}

	if (!results || isEmpty(results)) {
		return (
			<Empty className="min-h-72 border border-dashed border-border">
				<EmptyMedia variant="icon">
					<IconUser />
				</EmptyMedia>
				<EmptyHeader>
					<EmptyTitle>No faculty assigned</EmptyTitle>
					<EmptyDescription>
						Assign staff members to this program to get started.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={onAssign} variant="outline">
						<IconPlus />
						Assign staff
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<Card className="gap-0! py-0">
			<CardContent className="p-0!">
				<InfiniteScroll
					dataLength={results.length}
					next={() => loadMore(PROGRAM_FACULTY_LIST_PAGE_SIZE)}
					hasMore={paginationStatus === "CanLoadMore"}
					loader={<ProgramFacultyListSkeleton count={3} />}
				>
					{results.map((assignment) => {
						const { faculty } = assignment;
						const displayName = getFacultyDisplayName(
							faculty.firstName,
							faculty.lastName,
						);

						return (
							<Item
								key={assignment._id}
								className="relative rounded-none! border-x-0! border-t-0! border-border! last:border-b-0! hover:bg-accent/50!"
							>
								<Link
									className="absolute inset-0"
									href={programFacultyPath(programAlias, faculty._id)}
								/>
								<ItemMedia variant="image">
									<FacultyAvatar
										firstName={faculty.firstName}
										lastName={faculty.lastName}
										image={faculty.image}
										size="lg"
									/>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{displayName}</ItemTitle>
									<ItemDescription>
										{faculty.staffId} · {faculty.designation} · {faculty.email}
									</ItemDescription>
								</ItemContent>
								<div className="relative z-10 flex items-center gap-2 pr-4">
									{assignment.isHeadOfProgram && (
										<Badge variant="secondary">Head</Badge>
									)}
									<Badge
										variant="secondary"
										className={cn(
											"uppercase",
											faculty.status === "active"
												? "bg-success/20 text-success"
												: "bg-warning/20 text-warning",
										)}
									>
										{faculty.status}
									</Badge>
								</div>
							</Item>
						);
					})}
					{isLoading && <ProgramFacultyListSkeleton count={3} />}
				</InfiniteScroll>
			</CardContent>
		</Card>
	);
}

function ProgramFacultyListSkeleton({ count }: { count: number }) {
	return (
		<div className="divide-y divide-border">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 px-4 py-3">
					<Skeleton className="size-10 rounded-lg" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3 w-64" />
					</div>
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
			))}
		</div>
	);
}
