import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportSchema, ParsedImportFile } from "./types";

async function readFileAsText(file: Blob): Promise<string> {
	if ("text" in file && typeof file.text === "function") {
		return file.text();
	}

	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file"));
		reader.readAsText(file);
	});
}

async function readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
	if ("arrayBuffer" in file && typeof file.arrayBuffer === "function") {
		return file.arrayBuffer();
	}

	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (reader.result instanceof ArrayBuffer) {
				resolve(reader.result);
				return;
			}

			reject(new Error("Failed to read file as ArrayBuffer"));
		};
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file"));
		reader.readAsArrayBuffer(file);
	});
}

export function normalizeHeader(header: string) {
	return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function getSchemaColumnKeys(schema: ImportSchema) {
	return Object.keys(schema);
}

function buildHeaderToColumnKey(schema: ImportSchema) {
	const mapping = new Map<string, string>();

	for (const [columnKey, column] of Object.entries(schema)) {
		for (const name of column.possibleNames) {
			mapping.set(normalizeHeader(name), columnKey);
		}
		mapping.set(normalizeHeader(columnKey), columnKey);
	}

	return mapping;
}

function rowFromRecord(
	record: Record<string, string>,
	schema: ImportSchema,
	headerToColumnKey: Map<string, string>,
): Record<string, string> {
	const normalized: Partial<Record<string, string>> = {};

	for (const [key, value] of Object.entries(record)) {
		const columnKey = headerToColumnKey.get(normalizeHeader(key));
		if (columnKey) {
			normalized[columnKey] = value.trim();
		}
	}

	const columnKeys = getSchemaColumnKeys(schema);
	return columnKeys.reduce(
		(acc, columnKey) => {
			acc[columnKey] = normalized[columnKey] ?? "";
			return acc;
		},
		{} as Record<string, string>,
	);
}

function isRowEmpty(row: Record<string, string>, schema: ImportSchema) {
	return getSchemaColumnKeys(schema).every(
		(columnKey) => row[columnKey] === "",
	);
}

function parseCsv<S extends ImportSchema>(
	text: string,
	schema: ImportSchema,
): ParsedImportFile<S> {
	const headerToColumnKey = buildHeaderToColumnKey(schema);
	const result = Papa.parse<Record<string, string>>(text, {
		header: true,
		skipEmptyLines: true,
		transformHeader: normalizeHeader,
	});

	if (result.errors.some((error) => error.type !== "Delimiter")) {
		const fatalError = result.errors.find(
			(error) => error.type !== "Delimiter",
		);
		throw new Error(fatalError?.message ?? "Failed to parse CSV file");
	}

	const headers = (result.meta.fields ?? []).map(normalizeHeader);
	const rows = result.data
		.map((record) => rowFromRecord(record, schema, headerToColumnKey))
		.filter((row) => !isRowEmpty(row, schema));

	return { headers, rows } as ParsedImportFile<S>;
}

function parseExcel<S extends ImportSchema>(
	buffer: ArrayBuffer,
	schema: ImportSchema,
): ParsedImportFile<S> {
	const headerToColumnKey = buildHeaderToColumnKey(schema);
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

	const rows = json
		.map((record) => rowFromRecord(record, schema, headerToColumnKey))
		.filter((row) => !isRowEmpty(row, schema));

	return { headers, rows } as ParsedImportFile<S>;
}

export async function parseImportFile<S extends ImportSchema>(
	file: File,
	schema: S,
): Promise<ParsedImportFile<S>> {
	const extension = file.name.split(".").pop()?.toLowerCase();

	if (extension === "csv") {
		const text = await readFileAsText(file);
		return parseCsv(text, schema);
	}

	if (extension === "xlsx" || extension === "xls") {
		const buffer = await readFileAsArrayBuffer(file);
		return parseExcel(buffer, schema);
	}

	throw new Error("Unsupported file type. Use .csv, .xlsx, or .xls");
}
