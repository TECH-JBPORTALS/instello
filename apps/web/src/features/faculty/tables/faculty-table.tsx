"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import { Card, CardContent, CardHeader } from "@instello/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@instello/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@instello/ui/components/dropdown-menu";
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
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@instello/ui/components/tabs";
import { IconDots, IconUser, IconUserOff } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import Link from "next/link";
import { useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInsMutation, useInsPaginatedQuery } from "@/hooks/convex-react";
import { FACULTY_LIST_PAGE_SIZE } from "../constants";
import { FacultyAvatar } from "../faculty-avatar";
import { getFacultyDisplayName } from "../forms/shared-form";

type FacultyTableProps = {
	status: "active" | "inactive";
	searchQuery: string;
};

export function FacultyTable({ status, searchQuery }: FacultyTableProps) {
	const {
		results,
		status: paginationStatus,
		loadMore,
		isLoading,
	} = useInsPaginatedQuery(
		api.faculty.list,
		{ status },
		{ initialNumItems: FACULTY_LIST_PAGE_SIZE },
	);

	const filteredResults = useMemo(() => {
		if (!results) return results;
		const query = searchQuery.trim().toLowerCase();
		if (!query) return results;

		return results.filter((faculty) => {
			const fullName = getFacultyDisplayName(
				faculty.firstName,
				faculty.lastName,
			).toLowerCase();
			return (
				fullName.includes(query) ||
				faculty.email.toLowerCase().includes(query) ||
				faculty.staffId.toLowerCase().includes(query) ||
				faculty.designation.toLowerCase().includes(query)
			);
		});
	}, [results, searchQuery]);

	if (paginationStatus === "LoadingFirstPage") {
		return <FacultyListSkeleton count={8} />;
	}

	if (!filteredResults || isEmpty(filteredResults)) {
		return (
			<Empty className="min-h-72 border border-dashed border-border">
				<EmptyMedia variant="icon">
					<IconUser />
				</EmptyMedia>
				<EmptyHeader>
					<EmptyTitle>
						{searchQuery.trim()
							? "No matching faculty"
							: status === "active"
								? "No active faculty"
								: "No inactive faculty"}
					</EmptyTitle>
					<EmptyDescription>
						{searchQuery.trim()
							? "Try a different search term."
							: status === "active"
								? "Add staff members to get started."
								: "Deactivated faculty members will appear here."}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<Card className="gap-0! py-0">
			<CardContent className="p-0!">
				<InfiniteScroll
					dataLength={filteredResults.length}
					next={() => loadMore(FACULTY_LIST_PAGE_SIZE)}
					hasMore={paginationStatus === "CanLoadMore"}
					loader={<FacultyListSkeleton count={3} />}
				>
					{filteredResults.map((faculty) => (
						<FacultyListItem
							key={faculty._id}
							faculty={faculty}
							showDeactivate={status === "active"}
						/>
					))}
					{isLoading && <FacultyListSkeleton count={3} />}
				</InfiniteScroll>
			</CardContent>
		</Card>
	);
}

type FacultyListItemProps = {
	faculty: {
		_id: Id<"faculty">;
		firstName: string;
		lastName: string;
		email: string;
		staffId: string;
		designation: string;
		image?: string;
	};
	showDeactivate: boolean;
};

function FacultyListItem({ faculty, showDeactivate }: FacultyListItemProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeactivating, setIsDeactivating] = useState(false);
	const deactivateFaculty = useInsMutation(api.faculty.deactivate);

	const displayName = getFacultyDisplayName(
		faculty.firstName,
		faculty.lastName,
	);

	async function handleDeactivate() {
		setIsDeactivating(true);
		try {
			await deactivateFaculty({ id: faculty._id });
			setConfirmOpen(false);
		} finally {
			setIsDeactivating(false);
		}
	}

	return (
		<>
			<Item className="relative rounded-none! border-x-0! border-t-0! border-border! last:border-b-0! hover:bg-accent/50!">
				<Link className="absolute inset-0" href={`/faculty/${faculty._id}`} />
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
				{showDeactivate && (
					<ItemActions>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										variant="outline"
										size="icon-sm"
										className="relative z-10"
										onClick={(e) => e.stopPropagation()}
									/>
								}
							>
								<IconDots />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									variant="destructive"
									onClick={(e) => {
										e.stopPropagation();
										setConfirmOpen(true);
									}}
								>
									<IconUserOff className="size-4" />
									Deactivate
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</ItemActions>
				)}
			</Item>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Deactivate {displayName}?</DialogTitle>
						<DialogDescription>
							This faculty member will be moved to the inactive list. You can
							reactivate them later from their profile.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={isDeactivating}
							onClick={() => void handleDeactivate()}
						>
							Deactivate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function FacultyListSkeleton({ count }: { count: number }) {
	return (
		<Card>
			<CardHeader className="border-b">
				<Skeleton className="h-5 w-20" />
			</CardHeader>
			<CardContent className="p-0">
				{Array.from({ length: count }).map((_, index) => (
					<Item
						key={index}
						className="rounded-none border-x-0 border-t-0 border-border! last:border-b-0"
					>
						<ItemMedia variant="image">
							<Skeleton className="size-10 rounded-full" />
						</ItemMedia>
						<ItemContent className="space-y-2.5">
							<Skeleton className="h-3 w-28" />
							<Skeleton className="h-2 w-44" />
						</ItemContent>
						<ItemActions>
							<Skeleton className="size-6" />
						</ItemActions>
					</Item>
				))}
			</CardContent>
		</Card>
	);
}

export function FacultyStatusTabs({
	value,
	onChange,
}: {
	value: "active" | "inactive";
	onChange: (value: "active" | "inactive") => void;
}) {
	return (
		<Tabs
			value={value}
			onValueChange={(nextValue) =>
				onChange(nextValue as "active" | "inactive")
			}
		>
			<TabsList>
				<TabsTrigger value="active">Active</TabsTrigger>
				<TabsTrigger value="inactive">Inactive</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
