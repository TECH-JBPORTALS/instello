"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
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
import { IconPlus, IconUsers } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import Link from "next/link";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInsPaginatedQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { AddStudentButton } from "./add-student-button";
import { STUDENT_LIST_PAGE_SIZE } from "./constants";
import { NewStudentDialog } from "./dialogs/new-student-dialog";
import { getStudentDisplayName } from "./forms/shared-form";
import { StudentAvatar } from "./student-avatar";
import { studentPath } from "./student-path";

function StudentsListEmpty({ classId }: { classId: Id<"classes"> }) {
	const [open, setOpen] = useState(false);

	return (
		<Empty className="border border-border min-h-72 border-dashed">
			<EmptyMedia variant="icon">
				<IconUsers />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>No students yet</EmptyTitle>
				<EmptyDescription>
					Add students individually or import them from a CSV file.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={() => setOpen(true)} variant="outline">
					<IconPlus />
					Add student
				</Button>
			</EmptyContent>
			<NewStudentDialog open={open} onOpenChange={setOpen} classId={classId} />
		</Empty>
	);
}

function StudentsListSkeleton({ count }: { count: number }) {
	return (
		<div className="rounded-lg border shadow-xs">
			{Array.from({ length: count }).map((_, i) => (
				<Item
					key={i}
					className="border-x-0 border-t-0 hover:bg-accent/50 last:border-b-0 rounded-none border-border!"
				>
					<ItemMedia>
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

export function StudentsList({ classId }: { classId: Id<"classes"> }) {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const { results, status, loadMore, isLoading } = useInsPaginatedQuery(
		api.students.list,
		{ classId },
		{ initialNumItems: STUDENT_LIST_PAGE_SIZE },
	);

	if (status === "LoadingFirstPage") {
		return <StudentsListSkeleton count={8} />;
	}

	if (isEmpty(results)) {
		return <StudentsListEmpty classId={classId} />;
	}

	return (
		<InfiniteScroll
			dataLength={results.length}
			next={() => loadMore(STUDENT_LIST_PAGE_SIZE)}
			hasMore={status === "CanLoadMore"}
			loader={<StudentsListSkeleton count={3} />}
		>
			<ItemGroup className="bg-card">
				{results.map((student) => (
					<Item
						key={student._id}
						render={
							<Link href={studentPath(programAlias, classSlug, student._id)} />
						}
						className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
					>
						<ItemMedia>
							<StudentAvatar
								firstName={student.firstName}
								lastName={student.lastName}
								image={student.image}
							/>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								{getStudentDisplayName(student.firstName, student.lastName)}
							</ItemTitle>
							<ItemDescription>
								{student.usn} · {student.email}
							</ItemDescription>
						</ItemContent>
						<Badge variant="secondary">{student.categoryName}</Badge>
					</Item>
				))}
				{isLoading && <StudentsListSkeleton count={3} />}
			</ItemGroup>
		</InfiniteScroll>
	);
}
