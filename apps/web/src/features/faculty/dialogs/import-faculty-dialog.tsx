"use client";

import { Alert, AlertTitle } from "@instello/ui/components/alert";
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
	IconAlertCircle,
	IconCheck,
	IconDownload,
	IconTableImport,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ImportProgressHeader } from "../components/import-progress-header";
import { ImportRowList } from "../components/import-row-list";
import { downloadFacultyImportTemplate } from "../constants/import-template";
import { useFacultyImport } from "../hooks/use-faculty-import";
import type { ImportPhase } from "../types/import";

type ImportFacultyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const LIST_MAX_HEIGHT = "max-h-[min(55vh,28rem)]";

function phaseDescription(phase: ImportPhase, fileName: string | null) {
	switch (phase) {
		case "idle":
			return "Upload a CSV or Excel file using the template below. Rows are verified before import begins.";
		case "validating":
			return `Verifying ${fileName ?? "file"}…`;
		case "validationError":
			return fileName ?? "Fix the issues below and upload again.";
		case "ready":
			return "All rows passed validation.";
		case "importing":
			return `Importing ${fileName ?? "file"}…`;
		case "importError":
			return fileName ?? "Fix the failed row and upload again.";
		case "success":
			return "Import finished successfully.";
		default:
			return "";
	}
}

export function ImportFacultyDialog({
	open,
	onOpenChange,
}: ImportFacultyDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		phase,
		rows,
		completedCount,
		failedRowIndex,
		fileName,
		successCount,
		validateFile,
		startImport,
		reset,
	} = useFacultyImport();

	const hasFile = phase !== "idle";

	useEffect(() => {
		if (!open) {
			reset();
		}
	}, [open, reset]);

	const handleClose = (nextOpen: boolean) => {
		if (!nextOpen) {
			reset();
		}
		onOpenChange(nextOpen);
	};

	const handleFileChange = async (file: File | undefined) => {
		if (!file) return;

		await validateFile(file, { autoResume: completedCount > 0 });
	};

	const validatedCount = rows.filter(
		(row) =>
			row.status === "valid" ||
			row.status === "invalid" ||
			row.status === "success",
	).length;

	const isUploading = rows.some((row) => row.status === "uploading");
	const importedCount =
		phase === "importing"
			? completedCount + (isUploading ? 1 : 0)
			: rows.filter(
					(row) => row.status === "success" || row.status === "skipped",
				).length;

	const activeRowIndex =
		phase === "validating"
			? rows.findIndex((row) => row.status === "validating")
			: phase === "importing"
				? rows.findIndex((row) => row.status === "uploading")
				: failedRowIndex;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<input
					ref={inputRef}
					type="file"
					accept=".csv,.xlsx,.xls"
					className="sr-only"
					onChange={(e) => {
						const file = e.target.files?.[0];
						void handleFileChange(file);
						e.target.value = "";
					}}
				/>

				<DialogHeader className="shrink-0 px-6 pt-6">
					<DialogTitle>Import faculty</DialogTitle>
					<DialogDescription>
						{phaseDescription(phase, fileName)}
					</DialogDescription>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
					<AnimatePresence mode="wait">
						{phase === "idle" && (
							<motion.div
								key="idle"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								className="space-y-4"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm text-muted-foreground">
										Download the template to see required column names.
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={downloadFacultyImportTemplate}
									>
										<IconDownload className="size-4" />
										Download template
									</Button>
								</div>

								<button
									type="button"
									className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-muted/50"
									onClick={() => inputRef.current?.click()}
								>
									<IconTableImport className="size-8 text-muted-foreground" />
									<span className="text-sm font-medium">
										Choose a CSV or Excel file
									</span>
									<span className="text-xs text-muted-foreground">
										.csv, .xlsx, or .xls
									</span>
								</button>
							</motion.div>
						)}

						{hasFile && phase !== "success" && (
							<motion.div
								key={`file-${phase}`}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								className="flex min-h-0 flex-1 flex-col gap-3"
							>
								{phase === "validationError" && (
									<Alert variant="destructive">
										<IconAlertCircle />
										<AlertTitle>Validation failed</AlertTitle>
									</Alert>
								)}

								{phase === "importError" && (
									<Alert variant="destructive">
										<IconAlertCircle />
										<AlertTitle>Import stopped</AlertTitle>
									</Alert>
								)}

								{phase === "ready" && (
									<Alert>
										<IconCheck />
										<AlertTitle>Ready to import</AlertTitle>
									</Alert>
								)}

								{completedCount > 0 &&
									(phase === "validationError" || phase === "importError") && (
										<p className="text-sm text-muted-foreground">
											{completedCount} record
											{completedCount === 1 ? "" : "s"} already imported.
											Re-upload to continue from row{" "}
											{rows[completedCount]?.displayRow ?? completedCount + 2}.
										</p>
									)}

								{phase === "validating" && (
									<ImportProgressHeader
										label="Verifying rows"
										current={validatedCount}
										total={rows.length}
									/>
								)}

								{phase === "importing" && (
									<ImportProgressHeader
										label="Importing faculty"
										current={importedCount}
										total={rows.length}
									/>
								)}

								{rows.length > 0 && (
									<ImportRowList
										rows={rows}
										activeRowIndex={activeRowIndex}
										maxHeightClassName={LIST_MAX_HEIGHT}
									/>
								)}
							</motion.div>
						)}

						{phase === "success" && (
							<motion.div
								key="success"
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0 }}
								className="flex min-h-0 flex-1 flex-col gap-4"
							>
								<div className="space-y-1 text-center">
									<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
										<IconCheck className="size-6 text-primary" />
									</div>
									<h3 className="text-lg font-semibold">Import complete</h3>
									<p className="text-sm text-muted-foreground">
										Successfully imported {successCount} faculty member
										{successCount === 1 ? "" : "s"}.
									</p>
								</div>
								<ImportRowList
									rows={rows}
									maxHeightClassName={LIST_MAX_HEIGHT}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<DialogFooter className="shrink-0 border-t px-6 py-4">
					{phase === "success" ? (
						<Button onClick={() => handleClose(false)}>Done</Button>
					) : (
						<>
							<Button variant="outline" onClick={() => handleClose(false)}>
								Cancel
							</Button>
							{phase === "ready" && (
								<Button onClick={() => void startImport()}>
									{completedCount > 0 ? "Resume import" : "Import faculty"}
								</Button>
							)}
							{(phase === "validationError" || phase === "importError") && (
								<Button
									variant="outline"
									onClick={() => inputRef.current?.click()}
								>
									Fix issues and re-upload file
								</Button>
							)}
							{hasFile && phase !== "ready" && (
								<Button variant="ghost" onClick={reset}>
									Start over
								</Button>
							)}
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
