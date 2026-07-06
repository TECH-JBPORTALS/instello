import { nanoid } from "nanoid";
import {
	type HourSpan,
	isHourDropId,
	isPaletteDragId,
	parseHourDropId,
	parsePaletteDragId,
} from "./hour-span-utils";
import type { TimetableSubjectOption } from "./types";

/**
 * Exchange day and time range between two spans. Subject, room, and color stay with each id.
 */
export function swapHourSpans(a: HourSpan, b: HourSpan): [HourSpan, HourSpan] {
	return [
		{ ...a, day: b.day, start: b.start, end: b.end },
		{ ...b, day: a.day, start: a.start, end: a.end },
	];
}

/**
 * Maximal empty half-open range [start, end) on `day` that contains `dropHour`,
 * excluding the dragged span from occupancy.
 */
export function findGapAtHour(
	spans: HourSpan[],
	day: number,
	dropHour: number,
	excludeId: string,
	numberOfhours: number,
): { start: number; end: number } | null {
	if (dropHour < 0 || dropHour >= numberOfhours) {
		return null;
	}

	const daySpans = spans
		.filter((span) => span.day === day && span.id !== excludeId)
		.sort((a, b) => a.start - b.start);

	const occupied = daySpans.some(
		(span) => dropHour >= span.start && dropHour < span.end,
	);
	if (occupied) {
		return null;
	}

	let gapStart = 0;
	for (const span of daySpans) {
		if (span.end <= dropHour) {
			gapStart = Math.max(gapStart, span.end);
		}
	}

	let gapEnd = numberOfhours;
	for (const span of daySpans) {
		if (span.start > dropHour) {
			gapEnd = span.start;
			break;
		}
	}

	if (gapEnd - gapStart < 1) {
		return null;
	}

	return { start: gapStart, end: gapEnd };
}

/**
 * Place a dragged span on an empty drop hour. Preserves duration when the gap
 * is large enough; otherwise squeezes to fill the available gap.
 */
export function placeSpanAtDrop(
	dragged: HourSpan,
	targetDay: number,
	dropHour: number,
	spans: HourSpan[],
	numberOfhours: number,
): { day: number; start: number; end: number } | null {
	const gap = findGapAtHour(
		spans,
		targetDay,
		dropHour,
		dragged.id,
		numberOfhours,
	);
	if (!gap) {
		return null;
	}

	const duration = dragged.end - dragged.start;
	const gapSize = gap.end - gap.start;

	if (gapSize >= duration) {
		const start = Math.max(gap.start, Math.min(dropHour, gap.end - duration));
		return { day: targetDay, start, end: start + duration };
	}

	return { day: targetDay, start: gap.start, end: gap.end };
}

/**
 * Create a new span from a palette subject dropped on an empty hour cell.
 */
export function createSpanFromPaletteDrop(
	subject: TimetableSubjectOption,
	targetDay: number,
	dropHour: number,
	spans: HourSpan[],
	numberOfhours: number,
): HourSpan | null {
	const duration = subject.defaultDuration ?? 1;
	const tempSpan: HourSpan = {
		id: "__palette-temp__",
		day: 0,
		start: 0,
		end: duration,
		subjectId: subject.id,
		subject: subject.name,
		room: "",
		notes: "",
		color: subject.color,
	};

	const placement = placeSpanAtDrop(
		tempSpan,
		targetDay,
		dropHour,
		spans,
		numberOfhours,
	);
	if (!placement) {
		return null;
	}

	return {
		id: nanoid(),
		...placement,
		subjectId: subject.id,
		subject: subject.name,
		room: "",
		notes: "",
		color: subject.color,
	};
}

/**
 * Apply a drag-and-drop result for an existing span. Returns updated data or null.
 */
export function applySpanDrop(
	data: HourSpan[],
	activeId: string,
	overId: string | undefined,
	numberOfhours: number,
): HourSpan[] | null {
	if (!overId || activeId === overId) {
		return null;
	}

	const dragged = data.find((span) => span.id === activeId);
	if (!dragged) {
		return null;
	}

	const targetSpan = data.find((span) => span.id === overId);
	if (targetSpan && !isHourDropId(overId)) {
		const [newDragged, newTarget] = swapHourSpans(dragged, targetSpan);
		return data.map((span) => {
			if (span.id === newDragged.id) return newDragged;
			if (span.id === newTarget.id) return newTarget;
			return span;
		});
	}

	const hourDrop = parseHourDropId(overId);
	if (!hourDrop) {
		return null;
	}

	const placement = placeSpanAtDrop(
		dragged,
		hourDrop.day,
		hourDrop.hour,
		data,
		numberOfhours,
	);
	if (!placement) {
		return null;
	}

	return data.map((span) =>
		span.id === activeId ? { ...span, ...placement } : span,
	);
}

/**
 * Unified drop handler for palette subjects and existing spans.
 */
export function applyEditorDrop(
	data: HourSpan[],
	activeId: string,
	overId: string | undefined,
	numberOfhours: number,
	subjects: TimetableSubjectOption[],
): HourSpan[] | null {
	if (!overId || activeId === overId) {
		return null;
	}

	if (isPaletteDragId(activeId)) {
		const subjectId = parsePaletteDragId(activeId);
		if (!subjectId) return null;

		const subject = subjects.find((item) => item.id === subjectId);
		if (!subject) return null;

		const hourDrop = parseHourDropId(overId);
		if (!hourDrop) return null;

		const newSpan = createSpanFromPaletteDrop(
			subject,
			hourDrop.day,
			hourDrop.hour,
			data,
			numberOfhours,
		);
		if (!newSpan) return null;

		return [...data, newSpan];
	}

	return applySpanDrop(data, activeId, overId, numberOfhours);
}
