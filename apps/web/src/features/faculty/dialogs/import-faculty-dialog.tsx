"use client";

import { Button } from "@instello/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@instello/ui/components/dialog";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@instello/ui/components/field";
import { IconTableImport } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

type ImportFacultyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ImportFacultyDialog({
	open,
	onOpenChange,
}: ImportFacultyDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setFileName(null);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Import faculty</DialogTitle>
					<DialogDescription>
						Upload a CSV or Excel file to bulk import faculty members. This
						feature will be available soon.
					</DialogDescription>
				</DialogHeader>

				<Field>
					<FieldLabel>Faculty file</FieldLabel>
					<input
						ref={inputRef}
						type="file"
						accept=".csv,.xlsx,.xls"
						className="sr-only"
						onChange={(e) => {
							const file = e.target.files?.[0];
							setFileName(file?.name ?? null);
						}}
					/>
					<button
						type="button"
						className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-muted/50"
						onClick={() => inputRef.current?.click()}
					>
						<IconTableImport className="size-8 text-muted-foreground" />
						<span className="text-sm font-medium">
							{fileName ?? "Choose a CSV or Excel file"}
						</span>
						<span className="text-xs text-muted-foreground">
							.csv, .xlsx, or .xls
						</span>
					</button>
					<FieldDescription>
						Bulk import is not yet available. You can still select a file to
						preview the upload flow.
					</FieldDescription>
				</Field>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button disabled>Import faculty</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
