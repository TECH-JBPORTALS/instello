import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { parseImportFile } from "./parse-file";
import type { ImportSchema } from "./types";

const testSchema = {
	name: {
		possibleNames: ["name", "full_name"],
		validator: v.pipe(
			v.string(),
			v.transform((value) => value.trim()),
		),
	},
	email: {
		possibleNames: ["email"],
		validator: v.pipe(v.string(), v.email()),
	},
} satisfies ImportSchema;

function createFile(name: string, content: string, type = "text/csv") {
	return new File([content], name, { type });
}

describe("parseImportFile", () => {
	it("parses CSV with aliased headers", async () => {
		const file = createFile(
			"people.csv",
			"Full Name,email\nJane Doe,jane@example.com\n",
		);

		const parsed = await parseImportFile(file, testSchema);

		expect(parsed.headers).toEqual(["full_name", "email"]);
		expect(parsed.rows).toEqual([
			{ name: "Jane Doe", email: "jane@example.com" },
		]);
	});

	it("rejects unsupported file extensions", async () => {
		const file = createFile(
			"people.txt",
			"name,email\nJane,jane@example.com\n",
		);

		await expect(parseImportFile(file, testSchema)).rejects.toThrow(
			"Unsupported file type",
		);
	});

	it("filters blank rows", async () => {
		const file = createFile(
			"people.csv",
			"name,email\nJane Doe,jane@example.com\n,\n",
		);

		const parsed = await parseImportFile(file, testSchema);

		expect(parsed.rows).toHaveLength(1);
	});

	it("parses xlsx files", async () => {
		const XLSX = await import("xlsx");
		const workbook = XLSX.utils.book_new();
		const sheet = XLSX.utils.aoa_to_sheet([
			["name", "email"],
			["Jane Doe", "jane@example.com"],
		]);
		XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
		const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
		const file = new File([buffer], "people.xlsx", {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});

		const parsed = await parseImportFile(file, testSchema);

		expect(parsed.rows).toEqual([
			{ name: "Jane Doe", email: "jane@example.com" },
		]);
	});
});
