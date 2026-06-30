import * as v from "valibot";
import {
	FACULTY_IMPORT_COLUMNS,
	REQUIRED_FACULTY_IMPORT_COLUMNS,
	toDisplayRow,
} from "../constants/import-template";
import type {
	FacultyImportRowData,
	ImportRow,
	ImportValidationError,
} from "../types/import";
import type { ParsedFacultyFile } from "./parse-faculty-file";

const emailSchema = v.pipe(v.string(), v.email("Invalid email address"));

function parseDateToIso(value: string, column: string, rowIndex: number) {
	const trimmed = value.trim();
	if (!trimmed) return undefined;

	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		return trimmed;
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		throw {
			rowIndex,
			column,
			message: "must be a valid date (YYYY-MM-DD)",
		} satisfies ImportValidationError;
	}

	return parsed.toISOString().slice(0, 10);
}

function parseJoinedDate(value: string, rowIndex: number) {
	const trimmed = value.trim();
	if (!trimmed) return undefined;

	const iso = parseDateToIso(trimmed, "joined_date", rowIndex);
	if (!iso) return undefined;

	return new Date(iso).getTime();
}

function validateRequiredCell(
	value: string,
	column: string,
	rowIndex: number,
): ImportValidationError | null {
	if (value.trim() === "") {
		return {
			rowIndex,
			column,
			message: "value is blank",
		};
	}

	return null;
}

function validateZipCode(
	value: string,
	rowIndex: number,
): ImportValidationError | null {
	if (!/^\d{6}$/.test(value.trim())) {
		return {
			rowIndex,
			column: "zip_code",
			message: "must be 6 digits",
		};
	}

	return null;
}

function validateEmail(
	value: string,
	rowIndex: number,
): ImportValidationError | null {
	const result = v.safeParse(emailSchema, value.trim());
	if (!result.success) {
		return {
			rowIndex,
			column: "email",
			message: "invalid email address",
		};
	}

	return null;
}

export function validateImportHeaders(headers: string[]) {
	const normalized = headers.map((header) => header.trim().toLowerCase());
	const missing = FACULTY_IMPORT_COLUMNS.filter(
		(column) => !normalized.includes(column),
	);

	if (missing.length > 0) {
		return {
			ok: false as const,
			message: `Missing required columns: ${missing.join(", ")}`,
		};
	}

	const unexpected = normalized.filter(
		(header) =>
			header !== "" &&
			!FACULTY_IMPORT_COLUMNS.includes(
				header as (typeof FACULTY_IMPORT_COLUMNS)[number],
			),
	);

	if (unexpected.length > 0) {
		return {
			ok: false as const,
			message: `Unexpected columns: ${unexpected.join(", ")}`,
		};
	}

	return { ok: true as const };
}

function mapRow(
	row: Record<(typeof FACULTY_IMPORT_COLUMNS)[number], string>,
	rowIndex: number,
): { data: FacultyImportRowData | null; errors: ImportValidationError[] } {
	const errors: ImportValidationError[] = [];

	for (const column of REQUIRED_FACULTY_IMPORT_COLUMNS) {
		const error = validateRequiredCell(row[column], column, rowIndex);
		if (error) errors.push(error);
	}

	if (errors.length > 0) {
		return { data: null, errors };
	}

	const zipError = validateZipCode(row.zip_code, rowIndex);
	if (zipError) errors.push(zipError);

	const emailError = validateEmail(row.email, rowIndex);
	if (emailError) errors.push(emailError);

	let dateOfBirth: string | undefined;
	try {
		dateOfBirth = parseDateToIso(row.date_of_birth, "date_of_birth", rowIndex);
	} catch (error) {
		errors.push(error as ImportValidationError);
	}

	let joinedDate: number | undefined;
	try {
		joinedDate = parseJoinedDate(row.joined_date, rowIndex);
	} catch (error) {
		errors.push(error as ImportValidationError);
	}

	if (errors.length > 0 || !dateOfBirth) {
		return { data: null, errors };
	}

	return {
		data: {
			staffId: row.staff_id.trim(),
			firstName: row.first_name.trim(),
			lastName: row.last_name.trim(),
			dateOfBirth,
			email: row.email.trim(),
			designation: row.designation.trim(),
			qualification: row.qualification.trim(),
			specialization: row.specialization.trim(),
			joinedDate,
			phoneNumber: row.phone_number.trim(),
			addressLine: row.address_line.trim(),
			district: row.district.trim(),
			state: row.state.trim(),
			country: row.country.trim(),
			zipCode: row.zip_code.trim(),
			profilePicUrl: row.profile_pic_url.trim() || undefined,
		},
		errors,
	};
}

export function buildImportRows(parsed: ParsedFacultyFile): {
	rows: ImportRow[];
	errors: ImportValidationError[];
} {
	const headerValidation = validateImportHeaders(parsed.headers);
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

	const rows: ImportRow[] = [];
	const errors: ImportValidationError[] = [];

	for (let index = 0; index < parsed.rows.length; index++) {
		const row = parsed.rows[index];
		if (!row) continue;

		const mapped = mapRow(row, index);
		errors.push(...mapped.errors);

		rows.push({
			index,
			displayRow: toDisplayRow(index),
			data: mapped.data,
			status: mapped.errors.length > 0 ? "invalid" : "pending",
			errorMessage: mapped.errors[0]
				? `Row ${toDisplayRow(index)}, column \`${mapped.errors[0].column}\`: ${mapped.errors[0].message}`
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
	rows: ImportRow[],
	snapshot: { staffId: string; email: string }[],
) {
	if (rows.length < snapshot.length) return false;

	for (let i = 0; i < snapshot.length; i++) {
		const row = rows[i]?.data;
		const expected = snapshot[i];
		if (!row || !expected) return false;
		if (row.staffId !== expected.staffId || row.email !== expected.email) {
			return false;
		}
	}

	return true;
}

export function toCreateInput(data: FacultyImportRowData) {
	return {
		staffId: data.staffId,
		firstName: data.firstName,
		lastName: data.lastName,
		dateOfBirth: data.dateOfBirth,
		email: data.email,
		profilePicUrl: data.profilePicUrl,
		designation: data.designation,
		joinedDate: data.joinedDate,
		qualification: data.qualification,
		specialization: data.specialization,
		addressLine: data.addressLine,
		district: data.district,
		state: data.state,
		country: data.country,
		zipCode: data.zipCode,
		phoneNumber: data.phoneNumber,
	};
}
