"use client";

import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
} from "@instello/ui/components/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@instello/ui/components/dropdown-menu";
import {
	IconChevronDown,
	IconPlus,
	IconTableImport,
} from "@tabler/icons-react";
import { useState } from "react";
import { ImportStudentsDialog } from "./dialogs/import-students-dialog";
import { NewStudentDialog } from "./dialogs/new-student-dialog";

export function AddStudentButton({
	classId,
	disabled,
	isGroupsEnabled = false,
}: {
	classId: Id<"classes">;
	disabled?: boolean;
	isGroupsEnabled?: boolean;
}) {
	const [addOpen, setAddOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);

	return (
		<>
			<ButtonGroup>
				<Button disabled={disabled} onClick={() => setAddOpen(true)}>
					<IconPlus />
					Add
				</Button>
				<ButtonGroupSeparator />
				<DropdownMenu>
					<DropdownMenuTrigger
						disabled={disabled}
						render={<Button size="icon" disabled={disabled} />}
					>
						<IconChevronDown />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setAddOpen(true)}>
							<IconPlus className="size-4" />
							Add student
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setImportOpen(true)}>
							<IconTableImport className="size-4" />
							Import students
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</ButtonGroup>

			<NewStudentDialog
				open={addOpen}
				onOpenChange={setAddOpen}
				classId={classId}
				isGroupsEnabled={isGroupsEnabled}
			/>
			<ImportStudentsDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				classId={classId}
				isGroupsEnabled={isGroupsEnabled}
			/>
		</>
	);
}
