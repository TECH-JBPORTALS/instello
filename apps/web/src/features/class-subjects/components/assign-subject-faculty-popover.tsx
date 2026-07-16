"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { AvatarGroup, AvatarGroupCount } from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@instello/ui/components/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@instello/ui/components/popover";
import { Skeleton } from "@instello/ui/components/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@instello/ui/components/tooltip";
import { IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { FacultyAvatar } from "@/features/faculty/components/faculty-avatar";
import { getFacultyDisplayName } from "@/features/faculty/forms/shared-form";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";

const MAX_VISIBLE_AVATARS = 3;

type AssignedFaculty = {
	_id: Id<"faculty">;
	firstName: string;
	lastName: string;
	image?: string;
};

type AssignSubjectFacultyPopoverProps = {
	classId: Id<"classes">;
	programSubjectId: Id<"programSubjects">;
	assigned: AssignedFaculty[];
};

/** Returns more readable text for the tooltip
 *
 * Possible outputs:
 * 1. Harry Potter, Hermione Granger & Ron Weasley
 * 2. Harry Potter & Hermione Granger
 * 3. Harry Potter
 * 4. Assign faculty - (if no faculty in the assigned list)
 */
function getTooltipText(assigned: AssignedFaculty[]) {
	if (assigned.length === 0) {
		return "Assign faculty";
	}

	const names = assigned.map((f) => f.firstName.trim()).filter(Boolean);

	if (names.length === 0) {
		return "Assign faculty";
	}

	if (names.length === 1) {
		return names[0];
	}

	if (names.length === 2) {
		return `${names[0]} & ${names[1]}`;
	}

	return `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}

export function AssignSubjectFacultyPopover({
	classId,
	programSubjectId,
	assigned,
}: AssignSubjectFacultyPopoverProps) {
	const [open, setOpen] = useState(false);

	const programFaculty = useInsQuery(
		api.class.queries.listFacultyForSubjectAssign,
		open ? { classId } : "skip",
	);
	const assignFaculty = useInsMutation(
		api.class.mutations.assignSubjectFaculty,
	);
	const unassignFaculty = useInsMutation(
		api.class.mutations.unassignSubjectFaculty,
	);

	const assignedIds = new Set(assigned.map((f) => f._id));
	const visible = assigned.slice(0, MAX_VISIBLE_AVATARS);
	const overflow = assigned.length - visible.length;

	async function handleToggle(facultyId: Id<"faculty">) {
		try {
			if (assignedIds.has(facultyId)) {
				await unassignFaculty({ classId, programSubjectId, facultyId });
			} else {
				await assignFaculty({ classId, programSubjectId, facultyId });
			}
		} catch (error) {
			toast.error(
				getConvexErrorMessage(error, "Failed to update subject faculty"),
			);
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<Tooltip>
				<PopoverTrigger
					render={
						<Button
							render={<TooltipTrigger />}
							variant="ghost"
							size={assigned.length === 0 ? "icon" : "default"}
							className={assigned.length > 0 ? "h-8 gap-0 px-1.5" : undefined}
						/>
					}
					aria-label={getTooltipText(assigned)}
				>
					{assigned.length === 0 ? (
						<IconUserPlus className="size-4 text-muted-foreground" />
					) : (
						<AvatarGroup className="-space-x-1.5">
							{visible.map((faculty) => (
								<FacultyAvatar
									key={faculty._id}
									firstName={faculty.firstName}
									lastName={faculty.lastName}
									image={faculty.image}
									size="sm"
								/>
							))}
							{overflow > 0 ? (
								<AvatarGroupCount className="size-4 text-[9px]">
									+{overflow}
								</AvatarGroupCount>
							) : null}
						</AvatarGroup>
					)}
				</PopoverTrigger>
				<TooltipContent>{getTooltipText(assigned)}</TooltipContent>
			</Tooltip>

			<PopoverContent align="end" className="w-72 p-0">
				<Command>
					<CommandInput placeholder="Assign faculty…" />
					<CommandList>
						<CommandEmpty>
							{programFaculty === undefined ? (
								<AssignSubjectFacultySkeleton />
							) : programFaculty.length === 0 ? (
								"No program faculty yet"
							) : (
								"No matching faculty"
							)}
						</CommandEmpty>
						<CommandGroup>
							{(programFaculty ?? []).map((faculty) => {
								const displayName = getFacultyDisplayName(
									faculty.firstName,
									faculty.lastName,
								);
								const isAssigned = assignedIds.has(faculty._id);

								return (
									<CommandItem
										key={faculty._id}
										value={`${displayName} ${faculty.staffId} ${faculty.email}`}
										data-checked={isAssigned}
										onSelect={() => {
											void handleToggle(faculty._id);
										}}
										className="gap-3"
									>
										<FacultyAvatar
											firstName={faculty.firstName}
											lastName={faculty.lastName}
											image={faculty.image}
											size="sm"
										/>
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium">{displayName}</div>
											<div className="truncate text-xs text-muted-foreground">
												{faculty.staffId}
											</div>
										</div>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function AssignSubjectFacultySkeleton() {
	return (
		<div className="flex flex-col gap-2">
			{Array.from({ length: 10 }).map((_, i) => (
				<Skeleton key={i} className="h-8 w-full" />
			))}
		</div>
	);
}
