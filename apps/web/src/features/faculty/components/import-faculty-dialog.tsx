"use client";

import { api } from "@instello/convex/api";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
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
import * as v from "valibot";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { indianPhoneNumberSchema } from "@/lib/phone";
import {
	type ImportPhase,
	type ImportSchema,
	useCxImporter,
} from "@/lib/useCxImporter";
import { downloadFacultyImportTemplate } from "../constants";
import { ImportProgressHeader } from "./import-progress-header";
import { ImportRowList } from "./import-row-list";

type ImportFacultyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const LIST_MAX_HEIGHT = "max-h-[min(55vh,28rem)]";

function parseIsoDate(value: string) {
	const trimmed = value.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		return trimmed;
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error("must be a valid date (YYYY-MM-DD)");
	}

	return parsed.toISOString().slice(0, 10);
}

function parseOptionalJoinedDate(value: string) {
	const trimmed = value.trim();
	if (!trimmed) {
		return undefined;
	}

	return new Date(parseIsoDate(trimmed)).getTime();
}

const trimmedString = v.pipe(
	v.string(),
	v.transform((value) => value.trim()),
);

// Schema for the faculty import dialog
const facultyImportSchema = {
	staffId: {
		possibleNames: ["staff_id", "staffId"],
		validator: v.pipe(trimmedString, v.nonEmpty("Staff ID is required")),
	},
	firstName: {
		possibleNames: ["first_name", "firstName"],
		validator: v.pipe(trimmedString, v.nonEmpty("First name is required")),
	},
	lastName: {
		possibleNames: ["last_name", "lastName"],
		validator: v.pipe(trimmedString, v.nonEmpty("Last name is required")),
	},
	dateOfBirth: {
		possibleNames: ["date_of_birth", "dateOfBirth"],
		validator: v.pipe(
			trimmedString,
			v.nonEmpty("Date of birth is required"),
			v.transform((value) => parseIsoDate(value)),
		),
	},
	email: {
		possibleNames: ["email"],
		validator: v.pipe(
			trimmedString,
			v.nonEmpty("Email is required"),
			v.email("Invalid email address"),
		),
	},
	designation: {
		possibleNames: ["designation"],
		validator: v.pipe(trimmedString, v.nonEmpty("Designation is required")),
	},
	qualification: {
		possibleNames: ["qualification"],
		validator: v.pipe(trimmedString, v.nonEmpty("Qualification is required")),
	},
	specialization: {
		possibleNames: ["specialization"],
		validator: v.pipe(trimmedString, v.nonEmpty("Specialization is required")),
	},
	joinedDate: {
		possibleNames: ["joined_date", "joinedDate"],
		required: false,
		validator: v.pipe(
			trimmedString,
			v.check(
				(value) =>
					value === "" || !Number.isNaN(Date.parse(parseIsoDate(value))),
				"must be a valid date (YYYY-MM-DD)",
			),
		),
	},
	phoneNumber: {
		possibleNames: ["phone_number", "phoneNumber"],
		validator: indianPhoneNumberSchema,
	},
} satisfies ImportSchema;

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
	const createFaculty = useInsMutation(api.faculty.mutations.create);

	const {
		phase,
		rows,
		completedCount,
		fileName,
		successCount,
		hasFile,
		validatedCount,
		importedCount,
		activeRowIndex,
		validationErrors,
		validateFile,
		startImport,
		reset,
	} = useCxImporter({
		schema: facultyImportSchema,
		resumeIdentityFields: ["staffId", "email"],
		onImportRow: async (row) => {
			try {
				await createFaculty({
					staffId: row.staffId,
					firstName: row.firstName,
					lastName: row.lastName,
					dateOfBirth: row.dateOfBirth,
					email: row.email,
					designation: row.designation,
					joinedDate: parseOptionalJoinedDate(row.joinedDate ?? ""),
					qualification: row.qualification,
					specialization: row.specialization,
					phoneNumber: row.phoneNumber,
				});

				return { ok: true };
			} catch (error) {
				return {
					ok: false,
					message: getConvexErrorMessage(error, "Failed to create faculty"),
				};
			}
		},
	});

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
										{/** Show only header validation errors in details */}
										{validationErrors[0].rowIndex === 0 && (
											<AlertDescription>
												{validationErrors[0].message}
											</AlertDescription>
										)}
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
