"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import { Checkbox } from "@instello/ui/components/checkbox";
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
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@instello/ui/components/tabs";
import { IconPlus, IconSearch, IconUsers } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInsPaginatedQuery, useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { cn } from "@/lib/utils";
import { BulkActionsBar } from "./bulk-actions-bar";
import { STUDENT_LIST_PAGE_SIZE } from "./constants";
import { NewStudentDialog } from "./dialogs/new-student-dialog";
import { getStudentDisplayName } from "./forms/shared-form";
import { StudentAvatar } from "./student-avatar";
import { studentPath } from "./student-path";

const ALL_BATCHES_TAB = "all";

type StudentSummary = {
	_id: Id<"students">;
	firstName: string;
	lastName: string;
	usn: string;
	email: string;
	image?: string;
	batchLabel?: string;
	categoryName: string;
};

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

function StudentRow({
	student,
	href,
	selectable,
	selected,
	onToggle,
	showBatchBadge,
}: {
	student: StudentSummary;
	href: string;
	selectable: boolean;
	selected: boolean;
	onToggle: (checked: boolean) => void;
	showBatchBadge: boolean;
}) {
	const displayName = getStudentDisplayName(
		student.firstName,
		student.lastName,
	);

	return (
		<Item
			className={cn(
				"border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!",
				selected && "bg-accent/40 hover:bg-accent/40",
			)}
		>
			<Link href={href} className="absolute inset-0" aria-label={displayName} />
			{selectable && (
				<Checkbox
					checked={selected}
					onCheckedChange={onToggle}
					onClick={(event) => event.stopPropagation()}
					className="relative z-10"
					aria-label={`Select ${displayName}`}
				/>
			)}
			<ItemMedia>
				<StudentAvatar
					firstName={student.firstName}
					lastName={student.lastName}
					image={student.image}
				/>
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{displayName}</ItemTitle>
				<ItemDescription>
					{student.usn} · {student.email}
				</ItemDescription>
			</ItemContent>
			<div className="flex items-center gap-2">
				{showBatchBadge && student.batchLabel && (
					<Badge variant="outline">{student.batchLabel}</Badge>
				)}
				<Badge variant="secondary">{student.categoryName}</Badge>
			</div>
		</Item>
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

	if (status === "LoadingFirstPage") {
		return <StudentsListSkeleton count={8} />;
	}

	if (isEmpty(results)) {
		return <StudentsListEmpty classId={classId} isGroupsEnabled={false} />;
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
					<StudentRow
						key={student._id}
						student={student}
						href={studentPath(programAlias, classSlug, student._id)}
						selectable={false}
						selected={false}
						onToggle={() => {}}
						showBatchBadge={false}
					/>
				))}
				{isLoading && <StudentsListSkeleton count={3} />}
			</ItemGroup>
		</InfiniteScroll>
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

	const [selectedIds, setSelectedIds] = useState<Set<Id<"students">>>(
		() => new Set(),
	);
	const [selectionResetKey, setSelectionResetKey] = useState(activeBatch);

	if (selectionResetKey !== activeBatch) {
		setSelectionResetKey(activeBatch);
		setSelectedIds(new Set());
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

	function toggleStudent(id: Id<"students">, checked: boolean) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}

	function toggleAll(checked: boolean) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			for (const student of filteredResults) {
				if (checked) {
					next.add(student._id);
				} else {
					next.delete(student._id);
				}
			}
			return next;
		});
	}

	const clearSelection = () => setSelectedIds(new Set());

	const allSelected =
		filteredResults.length > 0 &&
		filteredResults.every((student) => selectedIds.has(student._id));
	const someSelected = filteredResults.some((student) =>
		selectedIds.has(student._id),
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
					<ItemGroup className="bg-card">
						<Item
							variant="muted"
							className="cursor-default border-x-0 border-t-0 last:border-b-0 rounded-none border-border!"
						>
							<Checkbox
								checked={allSelected}
								indeterminate={someSelected && !allSelected}
								disabled={filteredResults.length === 0}
								onCheckedChange={toggleAll}
								aria-label="Select all students"
							/>
							<ItemContent>
								<ItemTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
									Select all
								</ItemTitle>
							</ItemContent>
							<Badge variant="outline">{filteredResults.length}</Badge>
						</Item>
						{filteredResults.map((student) => (
							<StudentRow
								key={student._id}
								student={student}
								href={studentPath(programAlias, classSlug, student._id)}
								selectable
								selected={selectedIds.has(student._id)}
								onToggle={(checked) => toggleStudent(student._id, checked)}
								showBatchBadge={activeBatch === ALL_BATCHES_TAB}
							/>
						))}
						{isLoading && <StudentsListSkeleton count={3} />}
					</ItemGroup>
				</InfiniteScroll>
			)}

			<BulkActionsBar
				selectedCount={selectedIds.size}
				onCancel={clearSelection}
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
