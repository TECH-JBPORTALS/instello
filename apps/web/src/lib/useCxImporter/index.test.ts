import { act, renderHook, waitFor } from "@testing-library/react";
import * as v from "valibot";
import { describe, expect, it, vi } from "vitest";
import { useCxImporter } from "./index";
import type { ImportSchema } from "./types";

const testSchema = {
	name: {
		possibleNames: ["name"],
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

const validCsv =
	"name,email\nJane Doe,jane@example.com\nJohn Doe,john@example.com\n";
const invalidCsv = "name,email\n,jane@example.com\n";

function createFile(name: string, content: string) {
	return new File([content], name, { type: "text/csv" });
}

describe("useCxImporter", () => {
	it("starts in idle state", () => {
		const { result } = renderHook(() =>
			useCxImporter({
				schema: testSchema,
				onImportRow: vi.fn(),
				validationStaggerMs: 0,
			}),
		);

		expect(result.current.phase).toBe("idle");
		expect(result.current.rows).toEqual([]);
		expect(result.current.hasFile).toBe(false);
		expect(result.current.canStartImport).toBe(false);
	});

	it("validates a file and reaches ready", async () => {
		const { result } = renderHook(() =>
			useCxImporter({
				schema: testSchema,
				onImportRow: vi.fn(),
				validationStaggerMs: 0,
			}),
		);

		await act(async () => {
			await result.current.validateFile(createFile("people.csv", validCsv));
		});

		await waitFor(() => {
			expect(result.current.phase).toBe("ready");
		});

		expect(result.current.rows).toHaveLength(2);
		expect(result.current.rows.every((row) => row.status === "valid")).toBe(
			true,
		);
		expect(result.current.canStartImport).toBe(true);
		expect(result.current.validRowCount).toBe(2);
	});

	it("enters validationError for invalid rows", async () => {
		const { result } = renderHook(() =>
			useCxImporter({
				schema: testSchema,
				onImportRow: vi.fn(),
				validationStaggerMs: 0,
			}),
		);

		await act(async () => {
			await result.current.validateFile(createFile("people.csv", invalidCsv));
		});

		await waitFor(() => {
			expect(result.current.phase).toBe("validationError");
		});

		expect(result.current.validationErrors.length).toBeGreaterThan(0);
		expect(result.current.invalidRowCount).toBe(1);
	});

	it("imports all rows successfully", async () => {
		const onImportRow = vi
			.fn()
			.mockResolvedValue({ ok: true, createdCount: 1 });

		const { result } = renderHook(() =>
			useCxImporter({
				schema: testSchema,
				onImportRow,
				validationStaggerMs: 0,
			}),
		);

		await act(async () => {
			await result.current.validateFile(createFile("people.csv", validCsv));
		});

		await act(async () => {
			await result.current.startImport();
		});

		await waitFor(() => {
			expect(result.current.phase).toBe("success");
		});

		expect(onImportRow).toHaveBeenCalledTimes(2);
		expect(result.current.successCount).toBe(2);
		expect(
			result.current.rows.every(
				(row) => row.status === "skipped" || row.status === "success",
			),
		).toBe(true);
	});

	it("stops on import failure and preserves completed count", async () => {
		const onImportRow = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, createdCount: 1 })
			.mockResolvedValueOnce({ ok: false, message: "Duplicate email" });

		const { result } = renderHook(() =>
			useCxImporter({
				schema: testSchema,
				onImportRow,
				validationStaggerMs: 0,
			}),
		);

		await act(async () => {
			await result.current.validateFile(createFile("people.csv", validCsv));
		});

		await act(async () => {
			await result.current.startImport();
		});

		await waitFor(() => {
			expect(result.current.phase).toBe("importError");
		});

		expect(result.current.completedCount).toBe(1);
		expect(result.current.failedRowIndex).toBe(1);
		expect(result.current.importError).toContain("Duplicate email");
	});

	it("reset returns to idle and clears state", async () => {
		const { result } = renderHook(() =>
			useCxImporter({
				schema: testSchema,
				onImportRow: vi.fn(),
				validationStaggerMs: 0,
			}),
		);

		await act(async () => {
			await result.current.validateFile(createFile("people.csv", validCsv));
		});

		act(() => {
			result.current.reset();
		});

		expect(result.current.phase).toBe("idle");
		expect(result.current.rows).toEqual([]);
		expect(result.current.fileName).toBeNull();
		expect(result.current.completedCount).toBe(0);
	});

	it("auto-resumes import after re-upload", async () => {
		const onImportRow = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, createdCount: 1 })
			.mockResolvedValueOnce({ ok: false, message: "Duplicate email" })
			.mockResolvedValueOnce({ ok: true, createdCount: 1 });

		const { result } = renderHook(() =>
			useCxImporter({
				schema: testSchema,
				onImportRow,
				resumeIdentityFields: ["email"],
				validationStaggerMs: 0,
			}),
		);

		await act(async () => {
			await result.current.validateFile(createFile("people.csv", validCsv));
		});

		await act(async () => {
			await result.current.startImport();
		});

		await waitFor(() => {
			expect(result.current.phase).toBe("importError");
		});

		await act(async () => {
			await result.current.validateFile(createFile("people.csv", validCsv), {
				autoResume: true,
			});
		});

		await waitFor(() => {
			expect(result.current.phase).toBe("success");
		});

		expect(onImportRow).toHaveBeenCalledTimes(3);
		expect(result.current.successCount).toBe(2);
	});
});
