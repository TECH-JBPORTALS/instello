"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import { Card, CardContent } from "@instello/ui/components/card";
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
import { IconDots, IconPlus, IconSchool, IconUser } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";
import { FacultyAvatar } from "@/features/faculty/components/faculty-avatar";
import { programFacultyPath } from "@/features/faculty/faculty-path";
import { getFacultyDisplayName } from "@/features/faculty/forms/shared-form";
import { useInsMutation, useInsPaginatedQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { getConvexErrorMessage } from "@/lib/convex-error";
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

	const currentHop = results.find((assignment) => assignment.isHeadOfProgram);

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
							<ProgramFacultyListItem
								key={assignment._id}
								programId={programId}
								programAlias={programAlias}
								facultyId={faculty._id}
								displayName={displayName}
								staffId={faculty.staffId}
								designation={faculty.designation}
								email={faculty.email}
								image={faculty.image}
								status={faculty.status}
								firstName={faculty.firstName}
								lastName={faculty.lastName}
								isHeadOfProgram={assignment.isHeadOfProgram}
								currentHopName={
									currentHop && currentHop._id !== assignment._id
										? getFacultyDisplayName(
												currentHop.faculty.firstName,
												currentHop.faculty.lastName,
											)
										: null
								}
							/>
						);
					})}
					{isLoading && <ProgramFacultyListSkeleton count={3} />}
				</InfiniteScroll>
			</CardContent>
		</Card>
	);
}

type ProgramFacultyListItemProps = {
	programId: Id<"programs">;
	programAlias: string;
	facultyId: Id<"faculty">;
	displayName: string;
	staffId: string;
	designation: string;
	email: string;
	image: string | undefined;
	status: string;
	firstName: string;
	lastName: string;
	isHeadOfProgram: boolean;
	currentHopName: string | null;
};

function ProgramFacultyListItem({
	programId,
	programAlias,
	facultyId,
	displayName,
	staffId,
	designation,
	email,
	image,
	status,
	firstName,
	lastName,
	isHeadOfProgram,
	currentHopName,
}: ProgramFacultyListItemProps) {
	const [hopOpen, setHopOpen] = useState(false);
	const [removeHopOpen, setRemoveHopOpen] = useState(false);
	const [isSettingHop, setIsSettingHop] = useState(false);
	const [isRemovingHop, setIsRemovingHop] = useState(false);
	const setAsHeadOfProgram = useInsMutation(
		api.program.queries.setAsHeadOfProgram,
	);
	const removeAsHeadOfProgram = useInsMutation(
		api.program.queries.removeAsHeadOfProgram,
	);

	async function handleSetAsHop() {
		setIsSettingHop(true);
		try {
			await setAsHeadOfProgram({ programId, facultyId });
			toast.success(`${displayName} is now Head of Program`);
			setHopOpen(false);
		} catch (error) {
			toast.error(
				getConvexErrorMessage(error, "Failed to assign Head of Program"),
			);
		} finally {
			setIsSettingHop(false);
		}
	}

	async function handleRemoveAsHop() {
		setIsRemovingHop(true);
		try {
			await removeAsHeadOfProgram({ programId, facultyId });
			toast.success(`${displayName} is no longer Head of Program`);
			setRemoveHopOpen(false);
		} catch (error) {
			toast.error(
				getConvexErrorMessage(error, "Failed to remove Head of Program"),
			);
		} finally {
			setIsRemovingHop(false);
		}
	}

	return (
		<>
			<Item className="relative rounded-none! border-x-0! border-t-0! border-border! last:border-b-0! hover:bg-accent/50!">
				<Link
					className="absolute inset-0"
					href={programFacultyPath(programAlias, facultyId)}
				/>
				<ItemMedia variant="image">
					<FacultyAvatar
						firstName={firstName}
						lastName={lastName}
						image={image}
						size="lg"
					/>
				</ItemMedia>
				<ItemContent>
					<ItemTitle>{displayName}</ItemTitle>
					<ItemDescription>
						{staffId} · {designation} · {email}
					</ItemDescription>
				</ItemContent>
				<div className="relative z-10 flex items-center gap-2 pr-4">
					{isHeadOfProgram && <Badge variant="secondary">Head</Badge>}
					<Badge
						variant="secondary"
						className={cn(
							"uppercase",
							status === "active"
								? "bg-success/20 text-success"
								: "bg-warning/20 text-warning",
						)}
					>
						{status}
					</Badge>
					<MoreActionsMenu>
						{isHeadOfProgram ? (
							<DropdownMenuItem onClick={() => setRemoveHopOpen(true)}>
								<IconSchool className="size-4" />
								Remove as HOP
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem onClick={() => setHopOpen(true)}>
								<IconSchool className="size-4" />
								Make HOP
							</DropdownMenuItem>
						)}
					</MoreActionsMenu>
				</div>
			</Item>

			<Dialog open={hopOpen} onOpenChange={setHopOpen}>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Make {displayName} Head of Program?</DialogTitle>
						<DialogDescription>
							{currentHopName
								? `${currentHopName} will no longer be Head of Program. There can only be one HOP per program, and a person can only be HOP of one program.`
								: "They will become the Head of Program with principal-level access across the institution. A person can only be HOP of one program."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setHopOpen(false)}>
							Cancel
						</Button>
						<Button
							disabled={isSettingHop}
							onClick={() => void handleSetAsHop()}
						>
							{isSettingHop ? "Assigning…" : "Make HOP"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={removeHopOpen} onOpenChange={setRemoveHopOpen}>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Remove {displayName} as Head of Program?</DialogTitle>
						<DialogDescription>
							They will lose Head of Program access and keep their faculty role.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRemoveHopOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={isRemovingHop}
							onClick={() => void handleRemoveAsHop()}
						>
							{isRemovingHop ? "Removing…" : "Remove as HOP"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function MoreActionsMenu({ children }: { children: ReactNode }) {
	return (
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
			<DropdownMenuContent align="end">{children}</DropdownMenuContent>
		</DropdownMenu>
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
