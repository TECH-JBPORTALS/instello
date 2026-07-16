"use client";

import { api } from "@instello/convex/api";
import { authClient } from "@instello/convex/better-auth/client";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
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
import { IconDots, IconMail, IconUser, IconUserOff } from "@tabler/icons-react";
import { isEmpty } from "lodash";
import Link from "next/link";
import { type MouseEvent, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";
import { useInsMutation, useInsPaginatedQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import {
	FACULTY_LIST_PAGE_SIZE,
	type FacultyStatus,
	type FacultyStatusFilter,
} from "../constants";
import { facultyPath } from "../faculty-path";
import { getFacultyDisplayName } from "../forms/shared-form";
import { FacultyAvatar } from "./faculty-avatar";

type FacultyListProps = {
	statusFilter: FacultyStatusFilter;
	searchQuery: string;
};

export function FacultyList({ statusFilter, searchQuery }: FacultyListProps) {
	const status =
		statusFilter === "all" ? undefined : (statusFilter as FacultyStatus);

	const {
		results,
		status: paginationStatus,
		loadMore,
		isLoading,
	} = useInsPaginatedQuery(
		api.faculty.queries.list,
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
						{searchQuery.trim() ? "No matching faculty" : "No faculty members"}
					</EmptyTitle>
					<EmptyDescription>
						{searchQuery.trim()
							? "Try a different search term or filter."
							: statusFilter === "all"
								? "Add staff members to get started."
								: `No faculty with status “${statusFilter}”.`}
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
						<FacultyListItem key={faculty._id} faculty={faculty} />
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
		status: FacultyStatus;
	};
};

function FacultyListItem({ faculty }: FacultyListItemProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeactivating, setIsDeactivating] = useState(false);
	const [isInviting, setIsInviting] = useState(false);
	const [isCancellingInvite, setIsCancellingInvite] = useState(false);
	const deactivateFaculty = useInsMutation(api.faculty.mutations.deactivate);
	const inviteFaculty = useInsMutation(api.faculty.mutations.invite);
	const cancelInviteFaculty = useInsMutation(
		api.faculty.mutations.cancelInvite,
	);

	const displayName = getFacultyDisplayName(
		faculty.firstName,
		faculty.lastName,
	);

	async function handleInvite(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		setIsInviting(true);
		try {
			const { error } = await authClient.organization.inviteMember({
				email: faculty.email,
				role: "faculty",
				resend: true,
			});

			if (error) {
				toast.error(error.message ?? "Failed to send invitation");
				return;
			}

			await inviteFaculty({ id: faculty._id });
			toast.success(`Invitation sent to ${faculty.email}`);
		} catch (error) {
			toast.error(getConvexErrorMessage(error, "Failed to send invitation"));
		} finally {
			setIsInviting(false);
		}
	}

	async function handleCancelInvite(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		setIsCancellingInvite(true);
		try {
			const { data: invitations, error: listError } =
				await authClient.organization.listInvitations();

			if (listError) {
				toast.error(listError.message ?? "Failed to load invitations");
				return;
			}

			const invitation = invitations?.find(
				(item) =>
					item.email.toLowerCase() === faculty.email.toLowerCase() &&
					item.status === "pending",
			);

			if (invitation) {
				const { error: cancelError } =
					await authClient.organization.cancelInvitation({
						invitationId: invitation.id,
					});

				if (cancelError) {
					toast.error(cancelError.message ?? "Failed to cancel invitation");
					return;
				}
			}

			await cancelInviteFaculty({ id: faculty._id });
			toast.success("Invitation cancelled");
		} catch (error) {
			toast.error(getConvexErrorMessage(error, "Failed to cancel invitation"));
		} finally {
			setIsCancellingInvite(false);
		}
	}

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
				<Link className="absolute inset-0" href={facultyPath(faculty._id)} />
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
				<ItemActions>
					{faculty.status === "draft" && (
						<Button
							variant="secondary"
							size="sm"
							className="relative z-10"
							disabled={isInviting}
							onClick={(e) => void handleInvite(e)}
						>
							<IconMail className="size-4" />
							{isInviting ? "Inviting…" : "Invite"}
						</Button>
					)}
					{faculty.status === "invited" && (
						<Button
							variant="outline"
							size="sm"
							className="relative z-10"
							disabled={isCancellingInvite}
							onClick={(e) => void handleCancelInvite(e)}
						>
							{isCancellingInvite ? "Cancelling…" : "Cancel invitation"}
						</Button>
					)}
					{faculty.status === "active" && (
						<>
							<Badge variant="secondary" className="relative z-10">
								Active
							</Badge>
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
						</>
					)}
					{faculty.status === "inactive" && (
						<Badge variant="outline" className="relative z-10">
							Inactive
						</Badge>
					)}
				</ItemActions>
			</Item>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Deactivate {displayName}?</DialogTitle>
						<DialogDescription>
							This faculty member will be marked inactive. You can reactivate
							them later from their profile.
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
