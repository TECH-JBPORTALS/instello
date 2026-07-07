/** First period starts at this clock hour (24h). One timetable slot index = 1 hour. */
export const CLASS_START_HOUR = 9;

export const ATTENDANCE_GRACE_PERIOD_MS = 30 * 60 * 1000;

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * JS `Date.getTimezoneOffset()` convention: minutes to add to local time to get UTC.
 * Returns UTC epoch ms for local midnight on the given YYYY-MM-DD.
 */
export function sessionDateToDayStartMs(
	sessionDate: string,
	timezoneOffsetMinutes: number,
): number {
	const [year, month, day] = sessionDate.split("-").map(Number);
	if (!year || !month || !day) {
		throw new Error(`Invalid session date: ${sessionDate}`);
	}
	return Date.UTC(year, month - 1, day) + timezoneOffsetMinutes * 60 * 1000;
}

export function dayStartMsToSessionDate(
	dayStartMs: number,
	timezoneOffsetMinutes: number,
): string {
	const localMs = dayStartMs - timezoneOffsetMinutes * 60 * 1000;
	const date = new Date(localMs);
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function endOfDayMs(
	sessionDate: string,
	timezoneOffsetMinutes: number,
): number {
	return (
		sessionDateToDayStartMs(sessionDate, timezoneOffsetMinutes) + MS_PER_DAY - 1
	);
}

export function sessionDateFromNow(
	now: number,
	timezoneOffsetMinutes: number,
): string {
	const localMs = now - timezoneOffsetMinutes * 60 * 1000;
	return dayStartMsToSessionDate(
		Math.floor(localMs / MS_PER_DAY) * MS_PER_DAY +
			timezoneOffsetMinutes * 60 * 1000,
		timezoneOffsetMinutes,
	);
}

/** Weekday index 0=Monday … 5=Saturday for a session date in local timezone. */
export function weekdayFromSessionDate(
	sessionDate: string,
	timezoneOffsetMinutes: number,
): number {
	const dayStartMs = sessionDateToDayStartMs(
		sessionDate,
		timezoneOffsetMinutes,
	);
	const localMs = dayStartMs - timezoneOffsetMinutes * 60 * 1000;
	const utcDay = new Date(localMs).getUTCDay();
	return utcDay === 0 ? 6 : utcDay - 1;
}

export function sessionWindowMs(args: {
	sessionDate: string;
	startHour: number;
	endHour: number;
	timezoneOffsetMinutes: number;
}): { sessionStartMs: number; sessionEndMs: number } {
	const dayStartMs = sessionDateToDayStartMs(
		args.sessionDate,
		args.timezoneOffsetMinutes,
	);
	return {
		sessionStartMs:
			dayStartMs + (CLASS_START_HOUR + args.startHour) * MS_PER_HOUR,
		sessionEndMs: dayStartMs + (CLASS_START_HOUR + args.endHour) * MS_PER_HOUR,
	};
}

export function formatHourLabel(startHour: number, endHour: number): string {
	if (endHour - startHour <= 1) {
		return `H${startHour + 1}`;
	}
	return `H${startHour + 1} - H${endHour}`;
}

export function formatTimeRange(startHour: number, endHour: number): string {
	function formatClock(hourIndex: number): string {
		const hour24 = CLASS_START_HOUR + hourIndex;
		const period = hour24 >= 12 ? "pm" : "am";
		const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
		return `${hour12}:00${period}`;
	}
	return `${formatClock(startHour)} to ${formatClock(endHour)}`;
}
