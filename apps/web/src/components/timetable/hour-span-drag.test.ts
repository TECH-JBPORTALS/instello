import { describe, expect, it } from "vitest";
import {
	applyEditorDrop,
	applySpanDrop,
	createSpanFromPaletteDrop,
	findGapAtHour,
	placeSpanAtDrop,
	swapHourSpans,
} from "./hour-span-drag";
import type { HourSpan } from "./hour-span-utils";
import { formatHourDropId, formatPaletteDragId } from "./hour-span-utils";
import type { TimetableBatchOption, TimetableSubjectOption } from "./types";

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

const subjects: TimetableSubjectOption[] = [
	{
		id: "alloc-math",
		subjectId: "subj-math",
		name: "Mathematics",
		color: "#3B82F6",
		type: "theory",
	},
	{
		id: "alloc-lab",
		subjectId: "subj-lab",
		name: "Lab",
		color: "#A855F7",
		defaultDuration: 2,
		type: "practical",
	},
];

const batches: TimetableBatchOption[] = [
	{ id: "batch-1", label: "B01" },
	{ id: "batch-2", label: "B02" },
];

describe("swapHourSpans", () => {
	it("swaps day and time range on the same day", () => {
		const a = span({ id: "a", day: 0, start: 0, end: 1 });
		const b = span({ id: "b", day: 0, start: 3, end: 5, subject: "Lab" });

		const [newA, newB] = swapHourSpans(a, b);

		expect(newA).toMatchObject({ id: "a", day: 0, start: 3, end: 5 });
		expect(newB).toMatchObject({ id: "b", day: 0, start: 0, end: 1 });
		expect(newA.subject).toBe("Subject");
		expect(newB.subject).toBe("Lab");
	});

	it("swaps across different days", () => {
		const a = span({ id: "a", day: 0, start: 2, end: 4 });
		const b = span({ id: "b", day: 2, start: 1, end: 3 });

		const [newA, newB] = swapHourSpans(a, b);

		expect(newA).toMatchObject({ day: 2, start: 1, end: 3 });
		expect(newB).toMatchObject({ day: 0, start: 2, end: 4 });
	});
});

describe("findGapAtHour", () => {
	const spans = [
		span({ id: "a", day: 1, start: 0, end: 2 }),
		span({ id: "b", day: 1, start: 4, end: 5 }),
	];

	it("returns the gap containing the drop hour", () => {
		expect(findGapAtHour(spans, 1, 2, "x", 7)).toEqual({ start: 2, end: 4 });
	});

	it("returns null when the drop hour is occupied", () => {
		expect(findGapAtHour(spans, 1, 0, "x", 7)).toBeNull();
	});

	it("allows a different batch to use an occupied hour", () => {
		const batchSpans = [
			span({ id: "a", day: 1, start: 0, end: 2, batchId: "batch-1" }),
		];

		expect(findGapAtHour(batchSpans, 1, 0, "x", 7, "batch-2")).toEqual({
			start: 0,
			end: 7,
		});
	});
});

describe("placeSpanAtDrop", () => {
	it("preserves duration and anchors at the drop hour", () => {
		const dragged = span({ id: "drag", day: 0, start: 2, end: 4 });
		const spans = [span({ id: "other", day: 1, start: 0, end: 1 })];

		expect(placeSpanAtDrop(dragged, 1, 3, spans, 7)).toEqual({
			day: 1,
			start: 3,
			end: 5,
		});
	});

	it("squeezes a 2-hour span into a 1-hour gap", () => {
		const dragged = span({ id: "drag", day: 0, start: 2, end: 4 });
		const spans = [
			span({ id: "left", day: 1, start: 0, end: 2 }),
			span({ id: "right", day: 1, start: 3, end: 5 }),
		];

		expect(placeSpanAtDrop(dragged, 1, 2, spans, 7)).toEqual({
			day: 1,
			start: 2,
			end: 3,
		});
	});
});

describe("createSpanFromPaletteDrop", () => {
	it("creates a 1-hour span anchored at the drop hour", () => {
		// biome-ignore lint/style/noNonNullAssertion: <We are sure we get always subjects>
		const created = createSpanFromPaletteDrop(subjects[0]!, 1, 3, [], 7);

		expect(created).toMatchObject({
			day: 1,
			start: 3,
			end: 4,
			subjectId: "subj-math",
			subject: "Mathematics",
			color: "#3B82F6",
			subjectType: "theory",
		});
		expect(created?.id).toBeTruthy();
	});

	it("squeezes a 2-hour palette subject into a 1-hour gap", () => {
		const spans = [
			span({ id: "left", day: 1, start: 0, end: 2 }),
			span({ id: "right", day: 1, start: 3, end: 5 }),
		];

		// biome-ignore lint/style/noNonNullAssertion: <We are sure we get always subjects>
		const created = createSpanFromPaletteDrop(subjects[1]!, 1, 2, spans, 7);

		expect(created).toMatchObject({
			day: 1,
			start: 2,
			end: 3,
			subject: "Lab",
		});
	});

	it("auto-assigns a free batch when dropping on an occupied hour", () => {
		const spans = [
			span({
				id: "existing",
				day: 0,
				start: 0,
				end: 1,
				batchId: "batch-1",
				batchName: "B01",
			}),
		];

		const created = createSpanFromPaletteDrop(
			// biome-ignore lint/style/noNonNullAssertion: <We are sure we get always subjects>
			subjects[0]!,
			0,
			0,
			spans,
			7,
			batches,
		);

		expect(created).toMatchObject({
			day: 0,
			start: 0,
			end: 1,
			batchId: "batch-2",
			batchName: "B02",
			subject: "Mathematics",
		});
	});

	it("returns null when all batches are taken at the drop hour", () => {
		const spans = [
			span({ id: "a", day: 0, start: 0, end: 1, batchId: "batch-1" }),
			span({ id: "b", day: 0, start: 0, end: 1, batchId: "batch-2" }),
		];

		const created = createSpanFromPaletteDrop(
			// biome-ignore lint/style/noNonNullAssertion: <We are sure we get always subjects>
			subjects[0]!,
			0,
			0,
			spans,
			7,
			batches,
		);

		expect(created).toBeNull();
	});

	it("preserves practical type when the same subject has theory and practical allocations", () => {
		const dualSubjects: TimetableSubjectOption[] = [
			{
				id: "alloc-chem-theory",
				subjectId: "subj-chem",
				name: "Chemistry",
				color: "#000000",
				type: "theory",
			},
			{
				id: "alloc-chem-practical",
				subjectId: "subj-chem",
				name: "Chemistry",
				color: "#000000",
				type: "practical",
			},
		];

		// biome-ignore lint/style/noNonNullAssertion: <dualSubjects are guaranteed to be defined>
		const created = createSpanFromPaletteDrop(dualSubjects[1]!, 0, 0, [], 7);

		expect(created).toMatchObject({
			subjectId: "subj-chem",
			subjectType: "practical",
		});
	});
});

describe("applySpanDrop", () => {
	const data = [
		span({ id: "math", day: 0, start: 0, end: 1, subject: "Math" }),
		span({ id: "lab", day: 0, start: 2, end: 4, subject: "Lab" }),
		span({ id: "sci", day: 1, start: 1, end: 3, subject: "Science" }),
	];

	it("swaps when dropped on another span", () => {
		const next = applySpanDrop(data, "math", "sci", 7);
		expect(next).not.toBeNull();
		expect(next?.find((s) => s.id === "math")).toMatchObject({
			day: 1,
			start: 1,
			end: 3,
		});
		expect(next?.find((s) => s.id === "sci")).toMatchObject({
			day: 0,
			start: 0,
			end: 1,
		});
	});

	it("places on an empty hour cell", () => {
		const next = applySpanDrop(data, "lab", formatHourDropId(2, 5), 7);
		expect(next?.find((s) => s.id === "lab")).toMatchObject({
			day: 2,
			start: 5,
			end: 7,
		});
	});

	it("returns null when dropped on self", () => {
		expect(applySpanDrop(data, "math", "math", 7)).toBeNull();
	});

	it("returns null when there is no drop target", () => {
		expect(applySpanDrop(data, "math", undefined, 7)).toBeNull();
	});

	it("places on an hour occupied by a different batch", () => {
		const batchData = [
			span({
				id: "batch1",
				day: 0,
				start: 0,
				end: 2,
				batchId: "batch-1",
			}),
			span({
				id: "batch2",
				day: 0,
				start: 4,
				end: 5,
				batchId: "batch-2",
			}),
		];

		const next = applySpanDrop(batchData, "batch2", formatHourDropId(0, 0), 7);
		expect(next?.find((s) => s.id === "batch2")).toMatchObject({
			day: 0,
			start: 0,
			end: 1,
		});
	});
});

describe("applyEditorDrop", () => {
	it("appends a span when a palette subject is dropped on an empty hour", () => {
		const data = [span({ id: "math", day: 0, start: 0, end: 1 })];
		const next = applyEditorDrop(
			data,
			formatPaletteDragId("alloc-math"),
			formatHourDropId(1, 2),
			7,
			subjects,
		);

		expect(next).toHaveLength(2);
		expect(next?.[1]).toMatchObject({
			day: 1,
			start: 2,
			end: 3,
			subject: "Mathematics",
		});
	});

	it("delegates existing span moves to applySpanDrop", () => {
		const data = [
			span({ id: "math", day: 0, start: 0, end: 1 }),
			span({ id: "sci", day: 1, start: 1, end: 3 }),
		];
		const next = applyEditorDrop(data, "math", "sci", 7, subjects);
		expect(next?.find((s) => s.id === "math")).toMatchObject({
			day: 1,
			start: 1,
			end: 3,
		});
	});

	it("creates a sub-row when palette drop targets an occupied hour with a free batch", () => {
		const data = [
			span({
				id: "existing",
				day: 0,
				start: 0,
				end: 1,
				batchId: "batch-1",
			}),
		];

		const next = applyEditorDrop(
			data,
			formatPaletteDragId("alloc-math"),
			formatHourDropId(0, 0),
			7,
			subjects,
			batches,
		);

		expect(next).toHaveLength(2);
		expect(next?.[1]).toMatchObject({
			day: 0,
			start: 0,
			end: 1,
			batchId: "batch-2",
			batchName: "B02",
		});
	});
});
