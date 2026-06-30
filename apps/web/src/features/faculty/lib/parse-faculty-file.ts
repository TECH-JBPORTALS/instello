import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
	FACULTY_IMPORT_COLUMNS,
	type FacultyImportColumn,
} from "../constants/import-template";

export type ParsedFacultyFile = {
	headers: string[];
	rows: Record<FacultyImportColumn, string>[];
};

// Normalize a header name to a consistent format
function normalizeHeader(header: string) {
	return header.trim().toLowerCase().replace(/\s+/g, "_");
}

// Convert a record of strings to a record of FacultyImportColumn values
function rowFromRecord(
	record: Record<string, string>,
): Record<FacultyImportColumn, string> {
	const normalized: Partial<Record<FacultyImportColumn, string>> = {};

	for (const [key, value] of Object.entries(record)) {
		const column = normalizeHeader(key) as FacultyImportColumn;
		if (FACULTY_IMPORT_COLUMNS.includes(column)) {
			normalized[column] = value.trim();
		}
	}

	return FACULTY_IMPORT_COLUMNS.reduce(
		(acc, column) => {
			acc[column] = normalized[column] ?? "";
			return acc;
		},
		{} as Record<FacultyImportColumn, string>,
	);
}

function isRowEmpty(row: Record<FacultyImportColumn, string>) {
	return FACULTY_IMPORT_COLUMNS.every((column) => row[column] === "");
}

function parseCsv(text: string): ParsedFacultyFile {
	const result = Papa.parse<Record<string, string>>(text, {
		header: true,
		skipEmptyLines: true,
		transformHeader: normalizeHeader,
	});

	if (result.errors.length > 0) {
		throw new Error(result.errors[0]?.message ?? "Failed to parse CSV file");
	}

	const headers = (result.meta.fields ?? []).map(normalizeHeader);
	const rows = result.data.map(rowFromRecord).filter((row) => !isRowEmpty(row));

	return { headers, rows };
}

function parseExcel(buffer: ArrayBuffer): ParsedFacultyFile {
	const workbook = XLSX.read(buffer, { type: "array" });
	const sheetName = workbook.SheetNames[0];

	if (!sheetName) {
		throw new Error("The Excel file does not contain any sheets");
	}

	const sheet = workbook.Sheets[sheetName];
	if (!sheet) {
		throw new Error("Could not read the first worksheet");
	}

	const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
		raw: false,
	});

	const headers =
		json.length > 0
			? Object.keys(json[0] ?? {}).map(normalizeHeader)
			: ((
					XLSX.utils.sheet_to_json<string[]>(sheet, {
						header: 1,
						raw: false,
					})[0] as string[] | undefined
				)?.map(normalizeHeader) ?? []);

	const rows = json.map(rowFromRecord).filter((row) => !isRowEmpty(row));

	return { headers, rows };
}

// Parse a faculty file into a ParsedFacultyFile
export async function parseFacultyFile(file: File): Promise<ParsedFacultyFile> {
	const extension = file.name.split(".").pop()?.toLowerCase();

	if (extension === "csv") {
		const text = await file.text();
		return parseCsv(text);
	}

	if (extension === "xlsx" || extension === "xls") {
		const buffer = await file.arrayBuffer();
		return parseExcel(buffer);
	}

	throw new Error("Unsupported file type. Use .csv, .xlsx, or .xls");
}
