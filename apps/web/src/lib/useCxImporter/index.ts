"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseImportFile } from "./parse-file";
import type {
	ImportPhase,
	ImportRow,
	ImportRowSnapshot,
	ImportSchema,
	ImportValidationError,
	InferImportRow,
	UseCxImporterOptions,
	UseCxImporterReturn,
} from "./types";
import {
	buildImportRows,
	formatValidationError,
	pickSnapshotFields,
	rowsMatchSnapshot,
} from "./validate-import";

const DEFAULT_VALIDATION_STAGGER_MS = 40;

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCxImporter<S extends ImportSchema>(
	options: UseCxImporterOptions<S>,
): UseCxImporterReturn<S> {
	const {
		schema,
		onImportRow,
		resumeIdentityFields,
		validationStaggerMs = DEFAULT_VALIDATION_STAGGER_MS,
	} = options;

	const [phase, setPhase] = useState<ImportPhase>("idle");
	const [rows, setRows] = useState<ImportRow<InferImportRow<S>>[]>([]);
	const [validationErrors, setValidationErrors] = useState<
		ImportValidationError[]
	>([]);
	const [completedCount, setCompletedCount] = useState(0);
	const [importError, setImportError] = useState<string | null>(null);
	const [failedRowIndex, setFailedRowIndex] = useState<number | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [successCount, setSuccessCount] = useState(0);

	const snapshotRef = useRef<ImportRowSnapshot[]>([]);
	const importAbortRef = useRef(false);
	const completedCountRef = useRef(0);
	const rowsRef = useRef<ImportRow<InferImportRow<S>>[]>([]);
	const shouldAutoResumeRef = useRef(false);
	const onImportRowRef = useRef(onImportRow);

	useEffect(() => {
		onImportRowRef.current = onImportRow;
	}, [onImportRow]);

	useEffect(() => {
		completedCountRef.current = completedCount;
	}, [completedCount]);

	useEffect(() => {
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

		if (
			snapshotRef.current.length === 0 &&
			resumeFrom === 0 &&
			resumeIdentityFields &&
			resumeIdentityFields.length > 0
		) {
			snapshotRef.current = currentRows
				.map((row) => row.data)
				.filter((data): data is InferImportRow<S> => data !== null)
				.map((data) =>
					pickSnapshotFields(
						data as Record<string, unknown>,
						resumeIdentityFields,
					),
				);
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

			const result = await onImportRowRef.current(row.data, {
				index: i,
				displayRow: row.displayRow,
			});

			if (!result.ok) {
				setRows((prev) =>
					prev.map((item, index) =>
						index === i
							? {
									...item,
									status: "error",
									errorMessage: `Row ${row.displayRow}: ${result.message}`,
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
					`Row ${row.displayRow}: ${result.message}. Fix the issue and re-upload the file to continue.`,
				);
				setPhase("importError");
				return;
			}

			imported += result.createdCount ?? 1;
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
	}, [resumeIdentityFields]);

	const validateFile = useCallback(
		async (file: File, validateOptions?: { autoResume?: boolean }) => {
			importAbortRef.current = false;
			shouldAutoResumeRef.current =
				validateOptions?.autoResume ?? completedCountRef.current > 0;

			setFileName(file.name);
			setPhase("validating");
			setValidationErrors([]);
			setImportError(null);
			setFailedRowIndex(null);

			try {
				const parsed = await parseImportFile(file, schema);
				const { rows: builtRows, errors } = buildImportRows(parsed, schema);

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
				})) as ImportRow<InferImportRow<S>>[];

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

					await sleep(validationStaggerMs);

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
					resumeIdentityFields &&
					resumeIdentityFields.length > 0 &&
					importedSnapshot.length > 0 &&
					!rowsMatchSnapshot(
						builtRows as ImportRow<Record<string, unknown>>[],
						importedSnapshot,
						resumeIdentityFields,
					)
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
		[schema, startImport, validationStaggerMs, resumeIdentityFields],
	);

	const hasFile = phase !== "idle";
	const isBusy = phase === "validating" || phase === "importing";
	const canStartImport = phase === "ready";

	const validatedCount = useMemo(
		() =>
			rows.filter(
				(row) =>
					row.status === "valid" ||
					row.status === "invalid" ||
					row.status === "success",
			).length,
		[rows],
	);

	const isUploading = rows.some((row) => row.status === "uploading");
	const importedCount =
		phase === "importing"
			? completedCount + (isUploading ? 1 : 0)
			: rows.filter(
					(row) => row.status === "success" || row.status === "skipped",
				).length;

	const resolvedActiveRowIndex =
		phase === "validating"
			? rows.findIndex((row) => row.status === "validating")
			: phase === "importing"
				? rows.findIndex((row) => row.status === "uploading")
				: failedRowIndex;

	const activeRowIndex =
		resolvedActiveRowIndex !== null && resolvedActiveRowIndex >= 0
			? resolvedActiveRowIndex
			: null;

	const invalidRowCount = rows.filter((row) => row.status === "invalid").length;
	const validRowCount = rows.filter((row) => row.status === "valid").length;
	const totalRows = rows.length;

	return {
		phase,
		rows,
		validationErrors,
		completedCount,
		importError,
		failedRowIndex,
		fileName,
		successCount,
		hasFile,
		isBusy,
		canStartImport,
		validatedCount,
		importedCount,
		activeRowIndex,
		invalidRowCount,
		validRowCount,
		totalRows,
		validateFile,
		startImport,
		reset,
	};
}

export type {
	ImportPhase,
	ImportRow,
	ImportRowStatus,
	ImportSchema,
	ImportValidationError,
	InferImportRow,
	UseCxImporterOptions,
	UseCxImporterReturn,
} from "./types";
