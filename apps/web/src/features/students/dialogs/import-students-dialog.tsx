"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
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
import { useEffect, useMemo, useRef } from "react";
import * as v from "valibot";
import { ImportProgressHeader } from "@/features/faculty/components/import-progress-header";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import {
	formatIndianPhoneNumberForStorage,
	INDIAN_PHONE_ERROR_MESSAGE,
	indianPhoneNumberSchema,
	isValidIndianPhoneNumber,
} from "@/lib/phone";
import {
	type ImportPhase,
	type ImportSchema,
	useCxImporter,
} from "@/lib/useCxImporter";
import {
	ImportRowList,
	mapStudentImportRows,
} from "../components/import-row-list";
import {
	downloadStudentImportTemplate,
	GENDER_OPTIONS,
	type GenderOption,
} from "../constants";

type ImportStudentsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	classId: Id<"classes">;
	isGroupsEnabled?: boolean;
};

type ImportBatch = { _id: Id<"classBatches">; numIdx: number; label: string };

const LIST_MAX_HEIGHT = "max-h-[min(55vh,28rem)]";

const trimmedString = v.pipe(
	v.string(),
	v.transform((value) => value.trim()),
);

const optionalPhoneSchema = v.pipe(
	trimmedString,
	v.check(
		(value) => value === "" || isValidIndianPhoneNumber(value),
		INDIAN_PHONE_ERROR_MESSAGE,
	),
	v.transform((value) =>
		value === "" ? "" : formatIndianPhoneNumberForStorage(value),
	),
);

function buildStudentImportSchema(
	categoryNames: string[],
	batches: ImportBatch[],
): ImportSchema {
	const normalizedCategories = new Set(
		categoryNames.map((name) => name.toLowerCase()),
	);
	const batchNumbers = batches.map((batch) => String(batch.numIdx));

	const schema: ImportSchema = {
		usn: {
			possibleNames: ["usn"],
			validator: v.pipe(trimmedString, v.nonEmpty("USN is required")),
		},
		firstName: {
			possibleNames: ["first_name", "firstName"],
			validator: v.pipe(trimmedString, v.nonEmpty("First name is required")),
		},
		lastName: {
			possibleNames: ["last_name", "lastName"],
			validator: v.pipe(trimmedString, v.nonEmpty("Last name is required")),
		},
		email: {
			possibleNames: ["email"],
			validator: v.pipe(
				trimmedString,
				v.nonEmpty("Email is required"),
				v.email("Invalid email address"),
			),
		},
		gender: {
			possibleNames: ["gender"],
			validator: v.pipe(
				trimmedString,
				v.nonEmpty("Gender is required"),
				v.transform((value) => value.toLowerCase()),
				v.picklist(GENDER_OPTIONS, "Gender must be male, female, or others"),
			),
		},
		category: {
			possibleNames: ["category"],
			validator: v.pipe(
				trimmedString,
				v.nonEmpty("Category is required"),
				v.check(
					(value) => normalizedCategories.has(value.toLowerCase()),
					`Category must be one of: ${categoryNames.join(", ")}`,
				),
			),
		},
		phoneNumber: {
			possibleNames: ["phone_number", "phoneNumber"],
			validator: indianPhoneNumberSchema,
		},
		apaarId: {
			possibleNames: ["apaar_id", "apaarId"],
			required: false,
			validator: v.pipe(
				trimmedString,
				v.check(
					(value) => value === "" || /^\d{12}$/.test(value),
					"APAAR ID must be exactly 12 digits",
				),
			),
		},
		fatherName: {
			possibleNames: ["father_name", "fatherName"],
			required: false,
			validator: trimmedString,
		},
		fatherPhoneNumber: {
			possibleNames: ["father_phone_number", "fatherPhoneNumber"],
			required: false,
			validator: optionalPhoneSchema,
		},
		motherName: {
			possibleNames: ["mother_name", "motherName"],
			required: false,
			validator: trimmedString,
		},
		motherPhoneNumber: {
			possibleNames: ["mother_phone_number", "motherPhoneNumber"],
			required: false,
			validator: optionalPhoneSchema,
		},
		addressLine: {
			possibleNames: ["address_line", "addressLine"],
			required: false,
			validator: trimmedString,
		},
		city: {
			possibleNames: ["city"],
			required: false,
			validator: trimmedString,
		},
		state: {
			possibleNames: ["state"],
			required: false,
			validator: trimmedString,
		},
		postalCode: {
			possibleNames: ["postal_code", "postalCode"],
			required: false,
			validator: trimmedString,
		},
	};

	if (batches.length > 0) {
		schema.batch = {
			possibleNames: ["batch"],
			required: false,
			validator: v.pipe(
				trimmedString,
				v.check(
					(value) => value === "" || batchNumbers.includes(value),
					`Batch must be one of: ${batchNumbers.join(", ")} (leave blank to auto-assign)`,
				),
			),
		};
	}

	return schema;
}

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

export function ImportStudentsDialog({
	open,
	onOpenChange,
	classId,
	isGroupsEnabled = false,
}: ImportStudentsDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const createStudent = useInsMutation(api.students.create);
	const ensureCategories = useInsMutation(api.students.ensureCategories);
	const categories = useInsQuery(
		api.students.listCategories,
		open ? {} : "skip",
	);
	const batches = useInsQuery(
		api.classBatches.list,
		open && isGroupsEnabled ? { classId } : "skip",
	);

	useEffect(() => {
		if (open) {
			void ensureCategories({});
		}
	}, [open, ensureCategories]);

	const categoryNames = (categories ?? []).map((category) => category.name);
	const categoryByName = useMemo(
		() =>
			new Map(
				(categories ?? []).map((category) => [
					category.name.toLowerCase(),
					category._id,
				]),
			),
		[categories],
	);

	const resolvedBatches = useMemo<ImportBatch[]>(
		() => (isGroupsEnabled ? (batches ?? []) : []),
		[isGroupsEnabled, batches],
	);
	const batchByNumIdx = useMemo(
		() =>
			new Map(
				resolvedBatches.map((batch) => [String(batch.numIdx), batch._id]),
			),
		[resolvedBatches],
	);

	const importSchema = useMemo(
		() => buildStudentImportSchema(categoryNames, resolvedBatches),
		[categoryNames, resolvedBatches],
	);

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
		schema: importSchema,
		resumeIdentityFields: ["usn", "email"],
		onImportRow: async (row) => {
			const categoryId = categoryByName.get(row.category.toLowerCase());

			if (!categoryId) {
				return {
					ok: false,
					message: `Unknown category: ${row.category}`,
				};
			}

			const batchValue = (row as { batch?: string }).batch;
			const batchId = batchValue ? batchByNumIdx.get(batchValue) : undefined;

			try {
				await createStudent({
					classId,
					firstName: row.firstName,
					lastName: row.lastName,
					usn: row.usn,
					email: row.email,
					gender: row.gender as GenderOption,
					categoryId,
					phoneNumber: row.phoneNumber,
					apaarId: row.apaarId || undefined,
					batchId,
					fatherName: row.fatherName || undefined,
					fatherPhoneNumber: row.fatherPhoneNumber || undefined,
					motherName: row.motherName || undefined,
					motherPhoneNumber: row.motherPhoneNumber || undefined,
					addressLine: row.addressLine || undefined,
					city: row.city || undefined,
					state: row.state || undefined,
					postalCode: row.postalCode || undefined,
				});

				return { ok: true };
			} catch (error) {
				return {
					ok: false,
					message: getConvexErrorMessage(error, "Failed to create student"),
				};
			}
		},
	});

	const mappedRows = useMemo(
		() =>
			mapStudentImportRows(
				rows.map((row) => ({
					index: row.index,
					displayRow: row.displayRow,
					data: row.data as {
						firstName: string;
						lastName: string;
						usn: string;
						email: string;
					} | null,
					status: row.status,
					errorMessage: row.errorMessage,
				})),
			),
		[rows],
	);

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
					<DialogTitle>Import students</DialogTitle>
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
										onClick={() =>
											downloadStudentImportTemplate(resolvedBatches.length > 0)
										}
									>
										<IconDownload className="size-4" />
										Template
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

						{(phase === "validating" ||
							phase === "validationError" ||
							phase === "ready" ||
							phase === "importing" ||
							phase === "importError") && (
							<motion.div
								key="progress"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								className="space-y-4"
							>
								{phase === "validationError" && (
									<Alert variant="destructive">
										<IconAlertCircle />
										<AlertTitle>Validation failed</AlertTitle>
										{validationErrors[0]?.rowIndex === 0 && (
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
										label="Importing students"
										current={importedCount}
										total={rows.length}
									/>
								)}

								{mappedRows.length > 0 && (
									<ImportRowList
										rows={mappedRows}
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
										Successfully imported {successCount} student
										{successCount === 1 ? "" : "s"}.
									</p>
								</div>
								<ImportRowList
									rows={mappedRows}
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
									{completedCount > 0 ? "Resume import" : "Import students"}
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
