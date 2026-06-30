"use client";

import { api } from "@instello/convex/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInsMutation } from "@/hooks/convex-react";
import { parseFacultyFile } from "../lib/parse-faculty-file";
import {
	buildImportRows,
	formatValidationError,
	rowsMatchSnapshot,
	toCreateInput,
} from "../lib/validate-faculty-import";
import type {
	ImportPhase,
	ImportRow,
	ImportSnapshot,
	ImportValidationError,
} from "../types/import";

const VALIDATION_STAGGER_MS = 40;

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useFacultyImport() {
	const createBulk = useInsMutation(api.faculty.createBulk);

	const [phase, setPhase] = useState<ImportPhase>("idle");
	const [rows, setRows] = useState<ImportRow[]>([]);
	const [validationErrors, setValidationErrors] = useState<
		ImportValidationError[]
	>([]);
	const [completedCount, setCompletedCount] = useState(0);
	const [importError, setImportError] = useState<string | null>(null);
	const [failedRowIndex, setFailedRowIndex] = useState<number | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [successCount, setSuccessCount] = useState(0);

	const snapshotRef = useRef<ImportSnapshot[]>([]);
	const importAbortRef = useRef(false);
	const completedCountRef = useRef(0);
	const rowsRef = useRef<ImportRow[]>([]);
	const shouldAutoResumeRef = useRef(false);

	useEffect(() => {
		// Remember the completed count to resume from it
		completedCountRef.current = completedCount;
	}, [completedCount]);

	useEffect(() => {
		// Remember the rows to resume from them
		rowsRef.current = rows;
	}, [rows]);

	const reset = useCallback(() => {
		importAbortRef.current = true;
		shouldAutoResumeRef.current = false;
		setPhase("idle");
		setRows([]);
		setValidationErrors([]);
		setCompletedCount(0);
		completedCountRef.current = 0;
		setImportError(null);
		setFailedRowIndex(null);
		setFileName(null);
		setSuccessCount(0);
		snapshotRef.current = [];
		rowsRef.current = [];
	}, []);

	const startImport = useCallback(async () => {
		importAbortRef.current = false;
		setPhase("importing");
		setImportError(null);

		const resumeFrom = completedCountRef.current;
		const currentRows = rowsRef.current;

		if (snapshotRef.current.length === 0 && resumeFrom === 0) {
			snapshotRef.current = currentRows
				.map((row) => row.data)
				.filter((data): data is NonNullable<typeof data> => data !== null)
				.map((data) => ({ staffId: data.staffId, email: data.email }));
		}

		let imported = resumeFrom;

		for (let i = resumeFrom; i < currentRows.length; i++) {
			if (importAbortRef.current) return;

			const row = currentRows[i];
			if (!row?.data) continue;

			setRows((prev) =>
				prev.map((item, index) => {
					if (index < resumeFrom) {
						return { ...item, status: "skipped" };
					}
					if (index === i) {
						return { ...item, status: "uploading" };
					}
					return item;
				}),
			);

			const result = await createBulk({
				items: [toCreateInput(row.data)],
				startRowIndex: i,
			});

			if (result.error) {
				setRows((prev) =>
					prev.map((item, index) =>
						index === i
							? {
									...item,
									status: "error",
									errorMessage: `Row ${row.displayRow}: ${result.error?.message}`,
								}
							: index < imported
								? { ...item, status: "skipped" }
								: item,
					),
				);
				completedCountRef.current = imported;
				setCompletedCount(imported);
				setFailedRowIndex(i);
				setImportError(
					`Row ${row.displayRow}: ${result.error.message}. Fix the issue and re-upload the file to continue.`,
				);
				setPhase("importError");
				return;
			}

			imported += result.createdCount;
			completedCountRef.current = imported;
			setCompletedCount(imported);

			setRows((prev) =>
				prev.map((item, index) => {
					if (index === i) {
						return { ...item, status: "success" };
					}
					if (index < imported) {
						return { ...item, status: "skipped" };
					}
					return item;
				}),
			);
		}

		setSuccessCount(imported);
		setPhase("success");
	}, [createBulk]);

	const validateFile = useCallback(
		async (file: File, options?: { autoResume?: boolean }) => {
			importAbortRef.current = false;
			shouldAutoResumeRef.current =
				options?.autoResume ?? completedCountRef.current > 0;

			setFileName(file.name);
			setPhase("validating");
			setValidationErrors([]);
			setImportError(null);
			setFailedRowIndex(null);

			try {
				const parsed = await parseFacultyFile(file);
				const { rows: builtRows, errors } = buildImportRows(parsed);

				if (errors.some((error) => error.column === "headers")) {
					setValidationErrors(errors);
					setRows([]);
					rowsRef.current = [];
					setPhase("validationError");
					shouldAutoResumeRef.current = false;
					return;
				}

				const resumeFrom = completedCountRef.current;
				const initialRows = builtRows.map((row, index) => ({
					...row,
					status:
						index < resumeFrom ? ("skipped" as const) : ("pending" as const),
				}));

				setRows(initialRows);
				rowsRef.current = initialRows;

				for (let i = 0; i < initialRows.length; i++) {
					if (importAbortRef.current) return;

					if (i < resumeFrom) {
						continue;
					}

					setRows((current) => {
						const next = current.map((row, index) =>
							index === i ? { ...row, status: "validating" as const } : row,
						);
						rowsRef.current = next;
						return next;
					});

					await sleep(VALIDATION_STAGGER_MS);

					setRows((current) => {
						const next = current.map((row, index) => {
							if (index !== i) return row;
							const rowError = errors.find((error) => error.rowIndex === index);
							return {
								...row,
								status: rowError ? ("invalid" as const) : ("valid" as const),
								errorMessage: rowError
									? formatValidationError(rowError)
									: undefined,
							};
						});
						rowsRef.current = next;
						return next;
					});
				}

				if (errors.length > 0) {
					setValidationErrors(errors);
					setPhase("validationError");
					shouldAutoResumeRef.current = false;
					return;
				}

				const importedSnapshot = snapshotRef.current.slice(0, resumeFrom);
				if (
					resumeFrom > 0 &&
					importedSnapshot.length > 0 &&
					!rowsMatchSnapshot(builtRows, importedSnapshot)
				) {
					setValidationErrors([
						{
							rowIndex: 0,
							column: "headers",
							message:
								"Previously imported rows were changed. Fix the file or start over.",
						},
					]);
					setPhase("validationError");
					shouldAutoResumeRef.current = false;
					return;
				}

				setPhase("ready");

				if (shouldAutoResumeRef.current && resumeFrom > 0) {
					shouldAutoResumeRef.current = false;
					await startImport();
				}
			} catch (error) {
				setValidationErrors([
					{
						rowIndex: 0,
						column: "headers",
						message:
							error instanceof Error ? error.message : "Failed to read file",
					},
				]);
				setRows([]);
				rowsRef.current = [];
				setPhase("validationError");
				shouldAutoResumeRef.current = false;
			}
		},
		[startImport],
	);

	return {
		phase,
		rows,
		validationErrors,
		completedCount,
		importError,
		failedRowIndex,
		fileName,
		successCount,
		validateFile,
		startImport,
		reset,
	};
}
