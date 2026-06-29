"use client";

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
import { AddFacultyDialog } from "./dialogs/add-faculty-dialog";
import { ImportFacultyDialog } from "./dialogs/import-faculty-dialog";

export function AddFacultyButton({ disabled }: { disabled?: boolean }) {
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
							Add staff
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setImportOpen(true)}>
							<IconTableImport className="size-4" />
							Import faculty
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</ButtonGroup>

			<AddFacultyDialog open={addOpen} onOpenChange={setAddOpen} />
			<ImportFacultyDialog open={importOpen} onOpenChange={setImportOpen} />
		</>
	);
}
