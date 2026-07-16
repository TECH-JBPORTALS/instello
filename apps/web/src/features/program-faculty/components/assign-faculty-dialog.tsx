"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@instello/ui/components/combobox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@instello/ui/components/dialog";
import { isUndefined } from "lodash";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FacultyAvatar } from "@/features/faculty/components/faculty-avatar";
import { getFacultyDisplayName } from "@/features/faculty/forms/shared-form";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";

type AssignableFaculty = {
	_id: Id<"faculty">;
	firstName: string;
	lastName: string;
	email: string;
	staffId: string;
	designation: string;
	image?: string;
};

type AssignFacultyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	programId: Id<"programs">;
};

function facultySearchValue(faculty: AssignableFaculty) {
	return [
		getFacultyDisplayName(faculty.firstName, faculty.lastName),
		faculty.email,
		faculty.staffId,
		faculty.designation,
	].join(" ");
}

export function AssignFacultyDialog({
	open,
	onOpenChange,
	programId,
}: AssignFacultyDialogProps) {
	const [selected, setSelected] = useState<AssignableFaculty[]>([]);
	const [isAssigning, setIsAssigning] = useState(false);
	const anchor = useComboboxAnchor();

	const assignable = useInsQuery(
		api.program.queries.listAssignableFaculty,
		open ? { programId } : "skip",
	);
	const assignStaffMany = useInsMutation(api.program.queries.assignStaffMany);

	const items = useMemo(() => assignable ?? [], [assignable]);

	useEffect(() => {
		if (!open) {
			setSelected([]);
			setIsAssigning(false);
		}
	}, [open]);

	async function handleAssign() {
		if (selected.length === 0) return;
		setIsAssigning(true);
		try {
			await assignStaffMany({
				programId,
				facultyIds: selected.map((f) => f._id),
			});
			toast.success(
				selected.length === 1
					? "Staff assigned to program"
					: `${selected.length} staff assigned to program`,
			);
			onOpenChange(false);
		} catch (error) {
			toast.error(getConvexErrorMessage(error, "Failed to assign staff"));
		} finally {
			setIsAssigning(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Assign staff</DialogTitle>
					<DialogDescription>
						Search and select faculty members to add to this program.
					</DialogDescription>
				</DialogHeader>

				{isUndefined(assignable) ? (
					<div className="rounded-lg border border-border px-3 py-6 text-center text-sm text-muted-foreground">
						Loading faculty…
					</div>
				) : (
					<Combobox
						multiple
						autoHighlight
						items={items}
						value={selected}
						onValueChange={setSelected}
						itemToStringValue={facultySearchValue}
						isItemEqualToValue={(a, b) => a._id === b._id}
						disabled={isAssigning}
						autoComplete="new-password"
					>
						<ComboboxChips ref={anchor} className="w-full items-start min-h-20">
							<ComboboxValue>
								{(values) => (
									<Fragment>
										{(values as AssignableFaculty[]).map((faculty) => {
											const displayName = getFacultyDisplayName(
												faculty.firstName,
												faculty.lastName,
											);
											return (
												<ComboboxChip key={faculty._id}>
													<FacultyAvatar
														firstName={faculty.firstName}
														lastName={faculty.lastName}
														image={faculty.image}
														size="xs"
													/>
													{displayName}
												</ComboboxChip>
											);
										})}
										<ComboboxChipsInput
											placeholder={
												selected.length === 0
													? "Search faculty by name or email…"
													: "Add more…"
											}
											disabled={isAssigning}
										/>
									</Fragment>
								)}
							</ComboboxValue>
						</ComboboxChips>
						<ComboboxContent anchor={anchor} className="w-(--anchor-width)">
							<ComboboxEmpty>
								{items.length === 0
									? "No assignable faculty"
									: "No matching faculty"}
							</ComboboxEmpty>
							<ComboboxList>
								{(faculty) => {
									const displayName = getFacultyDisplayName(
										faculty.firstName,
										faculty.lastName,
									);
									return (
										<ComboboxItem
											key={faculty._id}
											value={faculty}
											className="gap-3"
										>
											<FacultyAvatar
												firstName={faculty.firstName}
												lastName={faculty.lastName}
												image={faculty.image}
												size="sm"
											/>
											<div className="min-w-0 flex-1">
												<div className="truncate text-sm font-medium">
													{displayName}
												</div>
												<div className="truncate text-xs text-muted-foreground">
													{faculty.staffId} · {faculty.email}
												</div>
											</div>
										</ComboboxItem>
									);
								}}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						disabled={isAssigning}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={selected.length === 0 || isAssigning}
						onClick={() => void handleAssign()}
					>
						{isAssigning ? (
							"Assigning…"
						) : selected.length === 0 ? (
							"Assign"
						) : (
							<Fragment>
								<Badge className="bg-primary-foreground/10 size-4">
									{selected.length}
								</Badge>{" "}
								Assign{" "}
							</Fragment>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
