import type { TimetableBatchOption } from "./types";

export interface HourSpan {
	id: string;
	day: number;
	/** Inclusive start hour index (0-based). */
	start: number;
	/** Exclusive end hour index (0-based). Duration = end - start. */
	end: number;
	subjectId: string;
	subject: string;
	subjectType?: "theory" | "practical";
	room: string;
	notes: string;
	color: string;
	batchId?: string;
	batchName?: string;
}

export interface SubRowLayout {
	subRowIndex: number;
	subRowCount: number;
}

type SpanRange = Pick<HourSpan, "day" | "start" | "end" | "batchId">;

/**
 * True when two half-open hour ranges [start, end) share at least one slot.
 * Adjacent spans do not collide: [0, 2) beside [2, 4) → false.
 */
export function hourRangesOverlap(
	startA: number,
	endA: number,
	startB: number,
	endB: number,
): boolean {
	return startA < endB && startB < endA;
}

/**
 * Whether two spans conflict for scheduling (mirrors backend slotsConflict).
 * Whole-class spans conflict with everything overlapping; batch spans only
 * conflict with whole-class or the same batch.
 */
export function spansConflict(a: SpanRange, b: SpanRange): boolean {
	if (a.day !== b.day) return false;
	if (!hourRangesOverlap(a.start, a.end, b.start, b.end)) return false;

	const aWholeClass = a.batchId === undefined;
	const bWholeClass = b.batchId === undefined;

	if (aWholeClass || bWholeClass) return true;
	return a.batchId === b.batchId;
}

/**
 * Returns the first span that conflicts with [start, end) on `day`,
 * excluding the span identified by `excludeId`.
 */
export function findConflictingSpan(
	spans: HourSpan[],
	excludeId: string,
	day: number,
	start: number,
	end: number,
	batchId?: string,
): HourSpan | undefined {
	const probe: SpanRange = { day, start, end, batchId };

	return spans.find(
		(span) => span.id !== excludeId && spansConflict(probe, span),
	);
}

/** @deprecated Use findConflictingSpan */
export function findCollidingSpan(
	spans: HourSpan[],
	excludeId: string,
	day: number,
	start: number,
	end: number,
): HourSpan | undefined {
	return findConflictingSpan(spans, excludeId, day, start, end, undefined);
}

/**
 * Whether a span may occupy [start, end) on `day` within grid bounds
 * without conflicting with any sibling span.
 */
export function canPlaceSpan(
	spans: HourSpan[],
	spanId: string,
	day: number,
	start: number,
	end: number,
	numberOfhours: number,
	batchId?: string,
): boolean {
	if (start < 0 || end > numberOfhours || end - start < 1) {
		return false;
	}

	return (
		findConflictingSpan(spans, spanId, day, start, end, batchId) === undefined
	);
}

/**
 * First batch that can occupy [start, end) on `day` without conflict.
 */
export function findFirstFreeBatch(
	spans: HourSpan[],
	day: number,
	start: number,
	end: number,
	batches: TimetableBatchOption[],
	excludeId = "__probe__",
): TimetableBatchOption | undefined {
	for (const batch of batches) {
		if (
			findConflictingSpan(spans, excludeId, day, start, end, batch.id) ===
			undefined
		) {
			return batch;
		}
	}
	return undefined;
}

/**
 * Furthest left `start` allowed when resizing the left edge of [initialStart, initialEnd).
 */
export function getMinStartForResize(
	siblings: HourSpan[],
	span: HourSpan,
	initialEnd: number,
): number {
	const blockingEnds = siblings
		.filter(
			(sibling) =>
				sibling.id !== span.id &&
				sibling.start < initialEnd &&
				spansConflict(span, sibling),
		)
		.map((sibling) => sibling.end);

	return blockingEnds.length > 0 ? Math.max(0, ...blockingEnds) : 0;
}

/**
 * Furthest right `end` allowed when resizing the right edge of [initialStart, initialEnd).
 */
export function getMaxEndForResize(
	siblings: HourSpan[],
	span: HourSpan,
	initialStart: number,
	numberOfhours: number,
): number {
	const blockingStarts = siblings
		.filter(
			(sibling) =>
				sibling.id !== span.id &&
				sibling.end > initialStart &&
				spansConflict(span, sibling),
		)
		.map((sibling) => sibling.start);

	return blockingStarts.length > 0
		? Math.min(numberOfhours, ...blockingStarts)
		: numberOfhours;
}

/**
 * Assigns vertical sub-row indices for overlapping spans on the same day.
 */
export function computeSubRowLayout(
	sessions: HourSpan[],
): Map<string, SubRowLayout> {
	const layout = new Map<string, SubRowLayout>();
	const visited = new Set<string>();

	for (const session of sessions) {
		if (visited.has(session.id)) continue;

		const group: HourSpan[] = [];
		const stack = [session];

		while (stack.length > 0) {
			const current = stack.pop();
			if (!current || visited.has(current.id)) continue;

			visited.add(current.id);
			group.push(current);

			for (const other of sessions) {
				if (
					!visited.has(other.id) &&
					current.day === other.day &&
					hourRangesOverlap(current.start, current.end, other.start, other.end)
				) {
					stack.push(other);
				}
			}
		}

		const sorted = [...group].sort(
			(a, b) =>
				(a.batchId ?? "").localeCompare(b.batchId ?? "") ||
				a.id.localeCompare(b.id),
		);
		const subRowCount = sorted.length;

		for (const [index, span] of sorted.entries()) {
			layout.set(span.id, { subRowIndex: index, subRowCount });
		}
	}

	for (const session of sessions) {
		if (!layout.has(session.id)) {
			layout.set(session.id, { subRowIndex: 0, subRowCount: 1 });
		}
	}

	return layout;
}

export function getMaxSubRowsForDay(sessions: HourSpan[]): number {
	let max = 1;
	for (const { subRowCount } of computeSubRowLayout(sessions).values()) {
		max = Math.max(max, subRowCount);
	}
	return max;
}

export const DAY_ROW_BASE_HEIGHT_PX = 80;

export function formatHourDropId(day: number, hour: number): string {
	return `hour-${day}-${hour}`;
}

export function parseHourDropId(
	id: string,
): { day: number; hour: number } | null {
	const match = /^hour-(\d+)-(\d+)$/.exec(id);
	if (!match) return null;
	return { day: Number(match[1]), hour: Number(match[2]) };
}

export function isHourDropId(id: string): boolean {
	return id.startsWith("hour-");
}

export function formatPaletteDragId(subjectId: string): string {
	return `palette-${subjectId}`;
}

export function isPaletteDragId(id: string): boolean {
	return id.startsWith("palette-");
}

export function parsePaletteDragId(id: string): string | null {
	if (!isPaletteDragId(id)) return null;
	return id.slice("palette-".length);
}
