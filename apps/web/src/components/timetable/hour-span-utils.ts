export interface HourSpan {
	id: string;
	day: number;
	/** Inclusive start hour index (0-based). */
	start: number;
	/** Exclusive end hour index (0-based). Duration = end - start. */
	end: number;
	subjectId: string;
	subject: string;
	room: string;
	notes: string;
	color: string;
	batchId?: string;
}

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
 * Returns the first span on the same day that overlaps [start, end),
 * excluding the span identified by `excludeId`.
 */
export function findCollidingSpan(
	spans: HourSpan[],
	excludeId: string,
	day: number,
	start: number,
	end: number,
): HourSpan | undefined {
	return spans.find(
		(span) =>
			span.id !== excludeId &&
			span.day === day &&
			hourRangesOverlap(start, end, span.start, span.end),
	);
}

/**
 * Whether a span may occupy [start, end) on `day` within grid bounds
 * without overlapping any sibling span.
 */
export function canPlaceSpan(
	spans: HourSpan[],
	spanId: string,
	day: number,
	start: number,
	end: number,
	numberOfhours: number,
): boolean {
	if (start < 0 || end > numberOfhours || end - start < 1) {
		return false;
	}

	return findCollidingSpan(spans, spanId, day, start, end) === undefined;
}

/**
 * Furthest left `start` allowed when resizing the left edge of [initialStart, initialEnd).
 */
export function getMinStartForResize(
	siblings: HourSpan[],
	spanId: string,
	initialEnd: number,
): number {
	const blockingEnds = siblings
		.filter((span) => span.id !== spanId && span.start < initialEnd)
		.map((span) => span.end);

	return blockingEnds.length > 0 ? Math.max(0, ...blockingEnds) : 0;
}

/**
 * Furthest right `end` allowed when resizing the right edge of [initialStart, initialEnd).
 */
export function getMaxEndForResize(
	siblings: HourSpan[],
	spanId: string,
	initialStart: number,
	numberOfhours: number,
): number {
	const blockingStarts = siblings
		.filter((span) => span.id !== spanId && span.end > initialStart)
		.map((span) => span.start);

	return blockingStarts.length > 0
		? Math.min(numberOfhours, ...blockingStarts)
		: numberOfhours;
}

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
