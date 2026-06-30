import * as v from "valibot";
import { describe, expect, it } from "vitest";
import type { ImportRow, ImportSchema } from "./types";
import {
	buildImportRows,
	formatValidationError,
	rowsMatchSnapshot,
	validateImportHeaders,
} from "./validate-import";

const testSchema = {
	name: {
		possibleNames: ["name"],
		validator: v.pipe(
			v.string(),
			v.nonEmpty("Name is required"),
			v.transform((value) => value.trim()),
		),
	},
	email: {
		possibleNames: ["email"],
		validator: v.pipe(v.string(), v.nonEmpty("Email is required"), v.email()),
	},
	notes: {
		possibleNames: ["notes"],
		required: false,
		validator: v.string(),
	},
} satisfies ImportSchema;

describe("validateImportHeaders", () => {
	it("reports missing required columns", () => {
		const result = validateImportHeaders(["name"], testSchema);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain("email");
		}
	});

	it("accepts valid headers", () => {
		const result = validateImportHeaders(
			["name", "email", "notes"],
			testSchema,
		);

		expect(result.ok).toBe(true);
	});
});

describe("buildImportRows", () => {
	it("returns a header error when columns are missing", () => {
		const { rows, errors } = buildImportRows(
			{ headers: ["name"], rows: [{ name: "Jane", email: "", notes: "" }] },
			testSchema,
		);

		expect(rows).toEqual([]);
		expect(errors[0]?.column).toBe("headers");
	});

	it("returns row errors for blank required cells", () => {
		const { rows, errors } = buildImportRows(
			{
				headers: ["name", "email", "notes"],
				rows: [{ name: "", email: "jane@example.com", notes: "" }],
			},
			testSchema,
		);

		expect(rows[0]?.status).toBe("invalid");
		expect(errors[0]?.column).toBe("name");
	});

	it("builds typed row data for valid rows", () => {
		const { rows, errors } = buildImportRows(
			{
				headers: ["name", "email", "notes"],
				rows: [{ name: "Jane Doe", email: "jane@example.com", notes: "" }],
			},
			testSchema,
		);

		expect(errors).toHaveLength(0);
		expect(rows[0]?.data).toEqual({
			name: "Jane Doe",
			email: "jane@example.com",
		});
	});
});

describe("formatValidationError", () => {
	it("formats row and column errors", () => {
		expect(
			formatValidationError({
				rowIndex: 0,
				column: "email",
				message: "invalid email address",
			}),
		).toBe("Row 2, column `email`: invalid email address");
	});
});

describe("rowsMatchSnapshot", () => {
	const rows: ImportRow<Record<string, unknown>>[] = [
		{
			index: 0,
			displayRow: 2,
			data: { name: "Jane", email: "jane@example.com" },
			status: "valid",
		},
		{
			index: 1,
			displayRow: 3,
			data: { name: "John", email: "john@example.com" },
			status: "valid",
		},
	];

	it("returns true when identity fields match", () => {
		expect(
			rowsMatchSnapshot(rows, [{ email: "jane@example.com" }], ["email"]),
		).toBe(true);
	});

	it("returns false when identity fields changed", () => {
		expect(
			rowsMatchSnapshot(rows, [{ email: "changed@example.com" }], ["email"]),
		).toBe(false);
	});
});
