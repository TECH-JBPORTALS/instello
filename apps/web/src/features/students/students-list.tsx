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
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { Item, ItemContent, ItemMedia } from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@instello/ui/components/tabs";
import { IconPlus, IconSearch, IconUsers } from "@tabler/icons-react";
import type { RowSelectionState } from "@tanstack/react-table";
import { isEmpty } from "lodash";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { DataTable } from "@/components/common/data-table";
import { useInsPaginatedQuery, useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { BulkActionsBar } from "./bulk-actions-bar";
import { STUDENT_LIST_PAGE_SIZE } from "./constants";
import { NewStudentDialog } from "./dialogs/new-student-dialog";
import { getStudentDisplayName } from "./forms/shared-form";
import { createStudentColumns, type StudentSummary } from "./student-columns";
import { studentPath } from "./student-path";

const ALL_BATCHES_TAB = "all";

function StudentsListEmpty({
	classId,
	isGroupsEnabled,
	title = "No students yet",
	description = "Add students individually or import them from a CSV file.",
}: {
	classId: Id<"classes">;
	isGroupsEnabled: boolean;
	title?: string;
	description?: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Empty className="border border-border min-h-72 border-dashed">
			<EmptyMedia variant="icon">
				<IconUsers />
			</EmptyMedia>
			<EmptyHeader>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={() => setOpen(true)} variant="outline">
					<IconPlus />
					Add student
				</Button>
			</EmptyContent>
			<NewStudentDialog
				open={open}
				onOpenChange={setOpen}
				classId={classId}
				isGroupsEnabled={isGroupsEnabled}
			/>
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

function FlatStudentsList({ classId }: { classId: Id<"classes"> }) {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const { results, status, loadMore, isLoading } = useInsPaginatedQuery(
		api.students.list,
		{ classId },
		{ initialNumItems: STUDENT_LIST_PAGE_SIZE },
	);

	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const columns = useMemo(
		() =>
			createStudentColumns({
				selectable: true,
				showBatchBadge: false,
				getHref: (studentId) => studentPath(programAlias, classSlug, studentId),
			}),
		[programAlias, classSlug],
	);

	const selectedStudents = results.filter(
		(student) => rowSelection[student._id],
	);

	const clearSelection = () => setRowSelection({});

	if (status === "LoadingFirstPage") {
		return <StudentsListSkeleton count={8} />;
	}

	if (isEmpty(results)) {
		return <StudentsListEmpty classId={classId} isGroupsEnabled={false} />;
	}

	return (
		<>
			<InfiniteScroll
				dataLength={results.length}
				next={() => loadMore(STUDENT_LIST_PAGE_SIZE)}
				hasMore={status === "CanLoadMore"}
				loader={<StudentsListSkeleton count={3} />}
			>
				<div className="overflow-hidden rounded-lg border bg-card shadow-xs">
					<DataTable
						columns={columns}
						data={results}
						getRowId={(student) => student._id}
						rowSelection={rowSelection}
						onRowSelectionChange={setRowSelection}
					/>
				</div>
				{isLoading && <StudentsListSkeleton count={3} />}
			</InfiniteScroll>

			<BulkActionsBar
				classId={classId}
				isGroupsEnabled={false}
				selectedStudents={selectedStudents}
				onCancel={clearSelection}
				onActionComplete={clearSelection}
			/>
		</>
	);
}

function BatchedStudentsList({ classId }: { classId: Id<"classes"> }) {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const batches = useInsQuery(api.classBatches.list, { classId });

	const [activeBatch, setActiveBatch] = useQueryState("batch", {
		defaultValue: ALL_BATCHES_TAB,
		history: "replace",
	});
	const [search, setSearch] = useQueryState("q", {
		defaultValue: "",
		history: "replace",
	});

	const activeBatchId =
		activeBatch === ALL_BATCHES_TAB
			? undefined
			: (activeBatch as Id<"classBatches">);

	const { results, status, loadMore, isLoading } = useInsPaginatedQuery(
		api.students.list,
		{ classId, batchId: activeBatchId },
		{ initialNumItems: STUDENT_LIST_PAGE_SIZE },
	);

	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [selectionResetKey, setSelectionResetKey] = useState(activeBatch);

	if (selectionResetKey !== activeBatch) {
		setSelectionResetKey(activeBatch);
		setRowSelection({});
	}

	const isSearching = search.trim().length > 0;

	const filteredResults = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return results;

		return results.filter((student) => {
			const fullName = getStudentDisplayName(
				student.firstName,
				student.lastName,
			).toLowerCase();
			return (
				fullName.includes(query) || student.usn.toLowerCase().includes(query)
			);
		});
	}, [results, search]);

	// The search box only filters students already loaded on the client, so
	// while searching we eagerly drain the rest of this tab's pages (bounded
	// by class/batch size) instead of relying on scroll position. Otherwise a
	// short, mostly-filtered-out page never reaches the scroll trigger, which
	// either gets stuck or fights react-infinite-scroll-component's own
	// bottom-of-content detection.
	useEffect(() => {
		if (isSearching && status === "CanLoadMore") {
			loadMore(STUDENT_LIST_PAGE_SIZE);
		}
	}, [isSearching, status, loadMore]);

	const columns = useMemo(
		() =>
			createStudentColumns({
				selectable: true,
				showBatchBadge: activeBatch === ALL_BATCHES_TAB,
				getHref: (studentId) => studentPath(programAlias, classSlug, studentId),
			}),
		[programAlias, classSlug, activeBatch],
	);

	const clearSelection = () => setRowSelection({});

	const selectedStudents: StudentSummary[] = results.filter(
		(student) => rowSelection[student._id],
	);

	return (
		<>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Tabs
					value={activeBatch}
					onValueChange={(value) => setActiveBatch(value as string)}
				>
					<TabsList>
						<TabsTrigger value={ALL_BATCHES_TAB}>All</TabsTrigger>
						{batches?.map((batch) => (
							<TabsTrigger key={batch._id} value={batch._id}>
								{batch.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<InputGroup className="w-full sm:w-64">
					<InputGroupAddon>
						<IconSearch />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Search by name or USN..."
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>
			</div>

			{status === "LoadingFirstPage" ? (
				<StudentsListSkeleton count={8} />
			) : isEmpty(filteredResults) ? (
				isSearching ? (
					status === "LoadingMore" ? (
						<StudentsListSkeleton count={3} />
					) : (
						<Empty className="min-h-56 border border-dashed border-border">
							<EmptyMedia variant="icon">
								<IconUsers />
							</EmptyMedia>
							<EmptyHeader>
								<EmptyTitle>No matching students</EmptyTitle>
								<EmptyDescription>
									Try a different search term.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)
				) : (
					<StudentsListEmpty
						classId={classId}
						isGroupsEnabled
						title={
							activeBatchId ? "No students in this batch" : "No students yet"
						}
						description={
							activeBatchId
								? "Students assigned to this batch will appear here."
								: "Add students individually or import them from a CSV file."
						}
					/>
				)
			) : (
				<InfiniteScroll
					dataLength={filteredResults.length}
					next={() => loadMore(STUDENT_LIST_PAGE_SIZE)}
					hasMore={!isSearching && status === "CanLoadMore"}
					loader={<StudentsListSkeleton count={3} />}
				>
					<div className="overflow-hidden rounded-lg border bg-card shadow-xs">
						<DataTable
							columns={columns}
							data={filteredResults}
							getRowId={(student) => student._id}
							rowSelection={rowSelection}
							onRowSelectionChange={setRowSelection}
						/>
					</div>
					{isLoading && <StudentsListSkeleton count={3} />}
				</InfiniteScroll>
			)}

			<BulkActionsBar
				classId={classId}
				isGroupsEnabled
				selectedStudents={selectedStudents}
				onCancel={clearSelection}
				onActionComplete={clearSelection}
			/>
		</>
	);
}

export function StudentsList({
	classId,
	isGroupsEnabled = false,
}: {
	classId: Id<"classes">;
	isGroupsEnabled?: boolean;
}) {
	if (!isGroupsEnabled) {
		return <FlatStudentsList classId={classId} />;
	}

	return <BatchedStudentsList classId={classId} />;
}
