import * as v from "valibot";
import { normalizeHeader } from "./parse-file";
import type {
	ImportRow,
	ImportRowSnapshot,
	ImportSchema,
	ImportValidationError,
	ParsedImportFile,
} from "./types";

/** File row number shown to users (1-based, header is row 1). */
export function toDisplayRow(dataRowIndex: number) {
	return dataRowIndex + 2;
}

function getResolvedHeaders(headers: string[], schema: ImportSchema) {
	const normalized = headers.map(normalizeHeader);
	const resolved = new Set<string>();

	for (const [columnKey, column] of Object.entries(schema)) {
		const aliases = column.possibleNames.map(normalizeHeader);
		if (
			normalized.includes(normalizeHeader(columnKey)) ||
			aliases.some((alias) => normalized.includes(alias))
		) {
			resolved.add(columnKey);
		}
	}

	return { normalized, resolved };
}

export function validateImportHeaders(headers: string[], schema: ImportSchema) {
	const columnKeys = Object.keys(schema);
	const { normalized, resolved } = getResolvedHeaders(headers, schema);
	const missing = columnKeys.filter((columnKey) => !resolved.has(columnKey));

	if (missing.length > 0) {
		return {
			ok: false as const,
			message: `Missing required columns: ${missing.join(", ")}`,
		};
	}

	const knownHeaders = new Set<string>();
	for (const [columnKey, column] of Object.entries(schema)) {
		knownHeaders.add(normalizeHeader(columnKey));
		for (const name of column.possibleNames) {
			knownHeaders.add(normalizeHeader(name));
		}
	}

	const unexpected = normalized.filter(
		(header) => header !== "" && !knownHeaders.has(header),
	);

	if (unexpected.length > 0) {
		return {
			ok: false as const,
			message: `Unexpected columns: ${unexpected.join(", ")}`,
		};
	}

	return { ok: true as const };
}

function getValidatorIssueMessage(issue: v.BaseIssue<unknown>) {
	if (typeof issue.message === "string" && issue.message.length > 0) {
		return issue.message;
	}

	return "invalid value";
}

function validateCell(
	value: string,
	columnKey: string,
	column: ImportSchema[string],
	rowIndex: number,
): { value: unknown; errors: ImportValidationError[] } {
	const isRequired = column.required !== false;

	if (value.trim() === "") {
		if (isRequired) {
			return {
				value: undefined,
				errors: [
					{
						rowIndex,
						column: columnKey,
						message: "value is blank",
					},
				],
			};
		}

		// Optional blank cells are omitted from the parsed row.
		return { value: undefined, errors: [] };
	}

	const result = v.safeParse(column.validator, value);
	if (!result.success) {
		const firstIssue = result.issues[0];
		return {
			value: undefined,
			errors: [
				{
					rowIndex,
					column: columnKey,
					message: firstIssue
						? getValidatorIssueMessage(firstIssue)
						: "invalid value",
				},
			],
		};
	}

	return { value: result.output, errors: [] };
}

function mapRow(
	row: Record<string, string>,
	rowIndex: number,
	schema: ImportSchema,
): { data: Record<string, unknown> | null; errors: ImportValidationError[] } {
	const errors: ImportValidationError[] = [];
	const data: Record<string, unknown> = {};

	for (const [columnKey, column] of Object.entries(schema)) {
		const cellValue = row[columnKey] ?? "";
		const validated = validateCell(cellValue, columnKey, column, rowIndex);
		errors.push(...validated.errors);

		if (validated.value !== undefined) {
			data[columnKey] = validated.value;
		}
	}

	if (errors.length > 0) {
		return { data: null, errors };
	}

	return { data, errors };
}

export function buildImportRows<S extends ImportSchema>(
	parsed: ParsedImportFile<S>,
	schema: S,
): {
	rows: ImportRow<Record<keyof S & string, unknown>>[];
	errors: ImportValidationError[];
} {
	const headerValidation = validateImportHeaders(parsed.headers, schema);
	if (!headerValidation.ok) {
		return {
			rows: [],
			errors: [
				{
					rowIndex: 0,
					column: "headers",
					message: headerValidation.message,
				},
			],
		};
	}

	const rows: ImportRow<Record<keyof S & string, unknown>>[] = [];
	const errors: ImportValidationError[] = [];

	for (let index = 0; index < parsed.rows.length; index++) {
		const row = parsed.rows[index];
		if (!row) continue;

		const mapped = mapRow(row, index, schema);
		errors.push(...mapped.errors);

		rows.push({
			index,
			displayRow: toDisplayRow(index),
			data: mapped.data as Record<keyof S & string, unknown> | null,
			status: mapped.errors.length > 0 ? "invalid" : "pending",
			errorMessage: mapped.errors[0]
				? formatValidationError(mapped.errors[0])
				: undefined,
		});
	}

	return { rows, errors };
}

export function formatValidationError(error: ImportValidationError) {
	if (error.column === "headers") {
		return error.message;
	}

	return `Row ${toDisplayRow(error.rowIndex)}, column \`${error.column}\`: ${error.message}`;
}

export function rowsMatchSnapshot(
	rows: ImportRow<Record<string, unknown>>[],
	snapshot: ImportRowSnapshot[],
	fields: string[],
) {
	if (rows.length < snapshot.length) return false;

	for (let i = 0; i < snapshot.length; i++) {
		const row = rows[i]?.data;
		const expected = snapshot[i];
		if (!row || !expected) return false;

		for (const field of fields) {
			if (row[field] !== expected[field]) {
				return false;
			}
		}
	}

	return true;
}

export function pickSnapshotFields(
	row: Record<string, unknown>,
	fields: string[],
): ImportRowSnapshot {
	const snapshot: ImportRowSnapshot = {};

	for (const field of fields) {
		const value = row[field];
		if (
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			snapshot[field] = value;
		}
	}

	return snapshot;
}
