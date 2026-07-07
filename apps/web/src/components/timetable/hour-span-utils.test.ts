import { describe, expect, it } from "vitest";
import type { HourSpan } from "./hour-span-utils";
import {
	canPlaceSpan,
	computeSubRowLayout,
	findConflictingSpan,
	findFirstFreeBatch,
	getMaxSubRowsForDay,
	hourRangesOverlap,
	spansConflict,
} from "./hour-span-utils";
import type { TimetableBatchOption } from "./types";

function span(overrides: Partial<HourSpan> & Pick<HourSpan, "id">): HourSpan {
	return {
		day: 0,
		start: 0,
		end: 1,
		subjectId: "subj-default",
		subject: "Subject",
		room: "101",
		notes: "",
		color: "#000000",
		...overrides,
	};
}

const batches: TimetableBatchOption[] = [
	{ id: "batch-1", label: "B01" },
	{ id: "batch-2", label: "B02" },
];

describe("spansConflict", () => {
	it("conflicts when whole-class overlaps batch-specific", () => {
		expect(
			spansConflict(
				{ day: 0, start: 0, end: 2, batchId: undefined },
				{ day: 0, start: 1, end: 3, batchId: "batch-1" },
			),
		).toBe(true);
	});

	it("does not conflict when different batches overlap", () => {
		expect(
			spansConflict(
				{ day: 0, start: 0, end: 2, batchId: "batch-1" },
				{ day: 0, start: 0, end: 2, batchId: "batch-2" },
			),
		).toBe(false);
	});

	it("conflicts when same batch overlaps", () => {
		expect(
			spansConflict(
				{ day: 0, start: 0, end: 2, batchId: "batch-1" },
				{ day: 0, start: 1, end: 3, batchId: "batch-1" },
			),
		).toBe(true);
	});

	it("does not conflict on different days", () => {
		expect(
			spansConflict(
				{ day: 0, start: 0, end: 2, batchId: "batch-1" },
				{ day: 1, start: 0, end: 2, batchId: "batch-1" },
			),
		).toBe(false);
	});

	it("does not conflict when adjacent", () => {
		expect(hourRangesOverlap(0, 2, 2, 4)).toBe(false);
		expect(
			spansConflict(
				{ day: 0, start: 0, end: 2, batchId: "batch-1" },
				{ day: 0, start: 2, end: 4, batchId: "batch-1" },
			),
		).toBe(false);
	});
});

describe("findConflictingSpan", () => {
	const spans = [
		span({ id: "a", day: 0, start: 0, end: 3, batchId: "batch-1" }),
		span({ id: "b", day: 0, start: 0, end: 3, batchId: "batch-2" }),
	];

	it("finds conflict for same batch", () => {
		expect(findConflictingSpan(spans, "x", 0, 0, 3, "batch-1")).toMatchObject({
			id: "a",
		});
	});

	it("returns undefined for different batch at same hours", () => {
		const onlyBatch1 = [
			span({ id: "a", day: 0, start: 0, end: 3, batchId: "batch-1" }),
		];
		expect(
			findConflictingSpan(onlyBatch1, "x", 0, 0, 3, "batch-2"),
		).toBeUndefined();
	});
});

describe("canPlaceSpan", () => {
	const spans = [
		span({ id: "a", day: 0, start: 0, end: 3, batchId: "batch-1" }),
	];

	it("allows placement for a different batch in the same hours", () => {
		expect(canPlaceSpan(spans, "new", 0, 0, 3, 7, "batch-2")).toBe(true);
	});

	it("rejects whole-class when batch slot exists", () => {
		expect(canPlaceSpan(spans, "new", 0, 0, 3, 7, undefined)).toBe(false);
	});
});

describe("findFirstFreeBatch", () => {
	const spans = [
		span({ id: "a", day: 0, start: 0, end: 3, batchId: "batch-1" }),
	];

	it("returns the first batch without a conflict", () => {
		expect(findFirstFreeBatch(spans, 0, 0, 3, batches)).toEqual(batches[1]);
	});

	it("returns undefined when all batches are taken", () => {
		const full = [
			span({ id: "a", day: 0, start: 0, end: 3, batchId: "batch-1" }),
			span({ id: "b", day: 0, start: 0, end: 3, batchId: "batch-2" }),
		];
		expect(findFirstFreeBatch(full, 0, 0, 3, batches)).toBeUndefined();
	});
});

describe("computeSubRowLayout", () => {
	it("assigns stacked indices for overlapping spans", () => {
		const sessions = [
			span({ id: "a", day: 0, start: 0, end: 2, batchId: "batch-1" }),
			span({ id: "b", day: 0, start: 0, end: 2, batchId: "batch-2" }),
		];

		const layout = computeSubRowLayout(sessions);

		expect(layout.get("a")).toEqual({ subRowIndex: 0, subRowCount: 2 });
		expect(layout.get("b")).toEqual({ subRowIndex: 1, subRowCount: 2 });
	});

	it("gives single spans one row", () => {
		const sessions = [span({ id: "a", day: 0, start: 0, end: 1 })];
		const layout = computeSubRowLayout(sessions);

		expect(layout.get("a")).toEqual({ subRowIndex: 0, subRowCount: 1 });
	});
});

describe("getMaxSubRowsForDay", () => {
	it("returns the largest overlap group size", () => {
		const sessions = [
			span({ id: "a", day: 0, start: 0, end: 2, batchId: "batch-1" }),
			span({ id: "b", day: 0, start: 0, end: 2, batchId: "batch-2" }),
			span({ id: "c", day: 0, start: 4, end: 5 }),
		];

		expect(getMaxSubRowsForDay(sessions)).toBe(2);
	});
});
