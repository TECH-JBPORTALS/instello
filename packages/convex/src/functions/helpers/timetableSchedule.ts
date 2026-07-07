import { sessionDateToDayStartMs } from "./academicSchedule";

export const MIN_TOTAL_HOURS = 4;
export const DEFAULT_TOTAL_HOURS = 7;
export const MAX_TOTAL_HOURS = 10;

export const MIN_PERIOD_DURATION_MS = 15 * 60 * 1000;
export const DEFAULT_PERIOD_DURATION_MS = 45 * 60 * 1000;
export const DEFAULT_CLASS_START_HOUR = 9;
export const DEFAULT_LUNCH_AFTER_PERIOD = 4;

const MS_PER_MINUTE = 60 * 1000;

export type PeriodTime = {
	startTime: number;
	endTime: number;
};

export type LunchBreakConfig = {
	enabled: boolean;
	afterPeriod: number;
	startTime: number;
	endTime: number;
};

export type TimetableSessionConfig = {
	totalHours: number;
	periods: PeriodTime[];
	lunchBreak?: LunchBreakConfig;
};

export type SessionConfigValidationError = {
	field: string;
	message: string;
};

/** Epoch ms for 9:00 AM on 1970-01-01 UTC (time-of-day anchor). */
export function timeOfDayMs(hours: number, minutes = 0): number {
	return Date.UTC(1970, 0, 1, hours, minutes);
}

export function extractTimeOfDayMs(timestamp: number): number {
	const date = new Date(timestamp);
	return (
		date.getUTCHours() * 60 * MS_PER_MINUTE +
		date.getUTCMinutes() * MS_PER_MINUTE
	);
}

export function buildDefaultPeriods(totalHours: number): PeriodTime[] {
	const periods: PeriodTime[] = [];
	let cursor = timeOfDayMs(DEFAULT_CLASS_START_HOUR);

	for (let index = 0; index < totalHours; index++) {
		const startTime = cursor;
		const endTime = cursor + DEFAULT_PERIOD_DURATION_MS;
		periods.push({ startTime, endTime });
		cursor = endTime;
	}

	return periods;
}

export function buildDefaultLunchBreak(
	periods: PeriodTime[],
	afterPeriod = DEFAULT_LUNCH_AFTER_PERIOD,
): LunchBreakConfig {
	const before = periods[afterPeriod - 1];
	const after = periods[afterPeriod];
	if (!before || !after) {
		throw new Error("Cannot build default lunch break for period index");
	}

	return {
		enabled: true,
		afterPeriod,
		startTime: before.endTime,
		endTime: after.startTime,
	};
}

export const DEFAULT_TIMETABLE_SESSION_CONFIG: TimetableSessionConfig = {
	totalHours: DEFAULT_TOTAL_HOURS,
	periods: buildDefaultPeriods(DEFAULT_TOTAL_HOURS),
};

export function normalizeSessionConfig(
	config?: Partial<TimetableSessionConfig> | null,
): TimetableSessionConfig {
	if (!config) {
		return DEFAULT_TIMETABLE_SESSION_CONFIG;
	}

	const totalHours = config.totalHours ?? DEFAULT_TOTAL_HOURS;
	const periods =
		config.periods && config.periods.length === totalHours
			? config.periods
			: buildDefaultPeriods(totalHours);

	const lunchBreak =
		config.lunchBreak?.enabled === true
			? {
					enabled: true,
					afterPeriod:
						config.lunchBreak.afterPeriod ?? DEFAULT_LUNCH_AFTER_PERIOD,
					startTime: config.lunchBreak.startTime,
					endTime: config.lunchBreak.endTime,
				}
			: undefined;

	return {
		totalHours,
		periods,
		...(lunchBreak ? { lunchBreak } : {}),
	};
}

function isValidTimeOfDay(timestamp: number): boolean {
	if (!Number.isFinite(timestamp) || timestamp < 0) {
		return false;
	}
	const date = new Date(timestamp);
	return (
		Number.isFinite(date.getTime()) &&
		date.getUTCSeconds() === 0 &&
		date.getUTCMilliseconds() === 0
	);
}

export function validateSessionConfig(
	config: TimetableSessionConfig,
): SessionConfigValidationError[] {
	const errors: SessionConfigValidationError[] = [];

	if (
		!Number.isInteger(config.totalHours) ||
		config.totalHours < MIN_TOTAL_HOURS ||
		config.totalHours > MAX_TOTAL_HOURS
	) {
		errors.push({
			field: "totalHours",
			message: `Total hours must be between ${MIN_TOTAL_HOURS} and ${MAX_TOTAL_HOURS}`,
		});
	}

	if (config.periods.length !== config.totalHours) {
		errors.push({
			field: "periods",
			message: "Period catalog must match total hours",
		});
	}

	for (let index = 0; index < config.periods.length; index++) {
		const period = config.periods[index];
		if (!period) continue;
		const label = `periods[${index}]`;

		if (
			!isValidTimeOfDay(period.startTime) ||
			!isValidTimeOfDay(period.endTime)
		) {
			errors.push({
				field: label,
				message: "Invalid time value",
			});
			continue;
		}

		const startMs = extractTimeOfDayMs(period.startTime);
		const endMs = extractTimeOfDayMs(period.endTime);

		if (startMs >= endMs) {
			errors.push({
				field: label,
				message: "Start time must be before end time",
			});
			continue;
		}

		if (endMs - startMs < MIN_PERIOD_DURATION_MS) {
			errors.push({
				field: label,
				message: "Period must be at least 15 minutes",
			});
		}

		const previous = config.periods[index - 1];
		if (previous) {
			const previousEndMs = extractTimeOfDayMs(previous.endTime);
			if (previousEndMs > startMs) {
				errors.push({
					field: label,
					message: "Period overlaps with the previous period",
				});
			}
		}
	}

	const lunch = config.lunchBreak;
	if (lunch?.enabled) {
		if (
			!Number.isInteger(lunch.afterPeriod) ||
			lunch.afterPeriod < 1 ||
			lunch.afterPeriod >= config.totalHours
		) {
			errors.push({
				field: "lunchBreak.afterPeriod",
				message: "Lunch must be placed between periods",
			});
		}

		if (
			!isValidTimeOfDay(lunch.startTime) ||
			!isValidTimeOfDay(lunch.endTime)
		) {
			errors.push({
				field: "lunchBreak",
				message: "Invalid lunch time value",
			});
		} else {
			const lunchStartMs = extractTimeOfDayMs(lunch.startTime);
			const lunchEndMs = extractTimeOfDayMs(lunch.endTime);

			if (lunchStartMs >= lunchEndMs) {
				errors.push({
					field: "lunchBreak",
					message: "Lunch start must be before lunch end",
				});
			}

			const before = config.periods[lunch.afterPeriod - 1];
			const after = config.periods[lunch.afterPeriod];
			if (before && after) {
				const beforeEndMs = extractTimeOfDayMs(before.endTime);
				const afterStartMs = extractTimeOfDayMs(after.startTime);

				if (lunchStartMs < beforeEndMs || lunchEndMs > afterStartMs) {
					errors.push({
						field: "lunchBreak",
						message: "Lunch must fit in the gap between periods",
					});
				}
			}
		}
	}

	return errors;
}

export function isSessionConfigValid(config: TimetableSessionConfig): boolean {
	return validateSessionConfig(config).length === 0;
}

export function periodTimeRange(
	config: TimetableSessionConfig,
	periodIndex: number,
): PeriodTime | null {
	return config.periods[periodIndex] ?? null;
}

export function lunchAfterPeriod(
	config: TimetableSessionConfig,
): number | undefined {
	return config.lunchBreak?.enabled ? config.lunchBreak.afterPeriod : undefined;
}

export function hasLunchBreak(config: TimetableSessionConfig): boolean {
	return config.lunchBreak?.enabled === true;
}

export function periodToColumnIndex(
	periodIndex: number,
	lunchAfter?: number,
): number {
	if (!lunchAfter || periodIndex < lunchAfter) {
		return periodIndex;
	}
	return periodIndex + 1;
}

export function totalGridColumns(
	totalHours: number,
	hasLunch: boolean,
): number {
	return totalHours + (hasLunch ? 1 : 0);
}

export function combineSessionDateTime(
	sessionDate: string,
	timestamp: number,
	timezoneOffsetMinutes: number,
): number {
	const dayStartMs = sessionDateToDayStartMs(
		sessionDate,
		timezoneOffsetMinutes,
	);
	return dayStartMs + extractTimeOfDayMs(timestamp);
}

export function sessionWindowMs(args: {
	config: TimetableSessionConfig;
	sessionDate: string;
	startHour: number;
	endHour: number;
	timezoneOffsetMinutes: number;
}): { sessionStartMs: number; sessionEndMs: number } {
	const startPeriod = args.config.periods[args.startHour];
	const endPeriod = args.config.periods[args.endHour - 1];

	if (!startPeriod || !endPeriod) {
		throw new Error("Session period out of bounds for timetable config");
	}

	return {
		sessionStartMs: combineSessionDateTime(
			args.sessionDate,
			startPeriod.startTime,
			args.timezoneOffsetMinutes,
		),
		sessionEndMs: combineSessionDateTime(
			args.sessionDate,
			endPeriod.endTime,
			args.timezoneOffsetMinutes,
		),
	};
}

export function formatTimeOfDay(timestamp: number): string {
	const date = new Date(timestamp);
	const hours24 = date.getUTCHours();
	const minutes = date.getUTCMinutes();
	const period = hours24 >= 12 ? "pm" : "am";
	const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
	const minutePart =
		minutes === 0 ? "" : `:${String(minutes).padStart(2, "0")}`;
	return `${hours12}${minutePart}${period}`;
}

export function formatPeriodTimeRange(
	config: TimetableSessionConfig,
	startHour: number,
	endHour: number,
): string {
	const startPeriod = config.periods[startHour];
	const endPeriod = config.periods[endHour - 1];
	if (!startPeriod || !endPeriod) {
		return "";
	}
	return `${formatTimeOfDay(startPeriod.startTime)} - ${formatTimeOfDay(endPeriod.endTime)}`;
}

export function formatLunchTimeRange(config: TimetableSessionConfig): string {
	if (!config.lunchBreak?.enabled) {
		return "";
	}
	return `${formatTimeOfDay(config.lunchBreak.startTime)} - ${formatTimeOfDay(config.lunchBreak.endTime)}`;
}
