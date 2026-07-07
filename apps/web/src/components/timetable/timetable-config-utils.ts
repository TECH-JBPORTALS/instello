import type { TimetableSessionConfig } from "@instello/convex/schedule";
import {
	DEFAULT_LUNCH_AFTER_PERIOD,
	DEFAULT_TIMETABLE_SESSION_CONFIG,
	extractTimeOfDayMs,
	MAX_TOTAL_HOURS,
	MIN_TOTAL_HOURS,
	timeOfDayMs,
} from "@instello/convex/schedule";

export const TIME_OPTION_STEP_MINUTES = 15;

const MINUTES_PER_DAY = 24 * 60;

/** Time-of-day timestamps at fixed minute intervals across a full day. */
export function buildTimeOptions(
	stepMinutes: number = TIME_OPTION_STEP_MINUTES,
): number[] {
	const options: number[] = [];
	for (let minutes = 0; minutes < MINUTES_PER_DAY; minutes += stepMinutes) {
		options.push(timeOfDayMs(Math.floor(minutes / 60), minutes % 60));
	}
	return options;
}

/**
 * Parse flexible time strings into a time-of-day timestamp.
 * Accepts "9", "9:05", "9:05am", "9 pm", "13:00", etc.
 */
export function parseTimeString(value: string): number | null {
	const trimmed = value.trim().toLowerCase();
	if (!trimmed) {
		return null;
	}

	const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(trimmed);
	if (!match?.[1]) {
		return null;
	}

	let hours = Number(match[1]);
	const minutes = match[2] ? Number(match[2]) : 0;
	const meridiem = match[3];

	if (
		!Number.isInteger(hours) ||
		!Number.isInteger(minutes) ||
		minutes < 0 ||
		minutes > 59
	) {
		return null;
	}

	if (meridiem) {
		if (hours < 1 || hours > 12) {
			return null;
		}
		if (meridiem === "am") {
			hours = hours === 12 ? 0 : hours;
		} else {
			hours = hours === 12 ? 12 : hours + 12;
		}
	} else if (hours < 0 || hours > 23) {
		return null;
	}

	return timeOfDayMs(hours, minutes);
}

export function createDefaultSessionConfig(): TimetableSessionConfig {
	return structuredClone(DEFAULT_TIMETABLE_SESSION_CONFIG);
}

export function resizeSessionConfig(
	config: TimetableSessionConfig,
	totalHours: number,
): TimetableSessionConfig {
	if (totalHours === config.totalHours) {
		return config;
	}

	if (totalHours > config.totalHours) {
		const periods = [...config.periods];
		let cursor = periods[periods.length - 1]?.endTime ?? timeOfDayMs(9);

		while (periods.length < totalHours) {
			const startTime = cursor;
			const endTime = cursor + 45 * 60 * 1000;
			periods.push({ startTime, endTime });
			cursor = endTime;
		}

		return {
			...config,
			totalHours,
			periods,
		};
	}

	const periods = config.periods.slice(0, totalHours);
	const lunchBreak =
		config.lunchBreak?.enabled && config.lunchBreak.afterPeriod < totalHours
			? config.lunchBreak
			: undefined;

	return {
		totalHours,
		periods,
		...(lunchBreak ? { lunchBreak } : {}),
	};
}

export function canReduceTotalHours(
	config: TimetableSessionConfig,
	spans: Array<{ end: number }>,
	newTotalHours: number,
): boolean {
	if (newTotalHours >= config.totalHours) {
		return true;
	}

	return spans.every((span) => span.end <= newTotalHours);
}

export function toggleLunchBreak(
	config: TimetableSessionConfig,
	enabled: boolean,
): TimetableSessionConfig {
	if (!enabled) {
		return {
			totalHours: config.totalHours,
			periods: config.periods,
		};
	}

	if (config.lunchBreak?.enabled) {
		return config;
	}

	const afterPeriod = Math.min(
		DEFAULT_LUNCH_AFTER_PERIOD,
		config.totalHours - 1,
	);
	const before = config.periods[afterPeriod - 1];
	if (!before) {
		return config;
	}

	const lunchDurationMs = 45 * 60 * 1000;
	const lunchStart = before.endTime;
	const lunchEnd = lunchStart + lunchDurationMs;
	const periods = config.periods.map((period, index) => {
		if (index < afterPeriod) {
			return period;
		}

		return {
			startTime: period.startTime + lunchDurationMs,
			endTime: period.endTime + lunchDurationMs,
		};
	});

	return {
		totalHours: config.totalHours,
		periods,
		lunchBreak: {
			enabled: true,
			afterPeriod,
			startTime: lunchStart,
			endTime: lunchEnd,
		},
	};
}

/**
 * Move the lunch break to sit after a different period, keeping its duration.
 * Un-shifts the periods around the current position, then re-creates the gap at
 * the new position.
 */
export function moveLunchBreak(
	config: TimetableSessionConfig,
	newAfterPeriod: number,
): TimetableSessionConfig {
	if (!config.lunchBreak?.enabled) {
		return config;
	}

	const currentAfterPeriod = config.lunchBreak.afterPeriod;
	if (
		newAfterPeriod === currentAfterPeriod ||
		newAfterPeriod < 1 ||
		newAfterPeriod > config.totalHours - 1
	) {
		return config;
	}

	const lunchDurationMs =
		config.lunchBreak.endTime - config.lunchBreak.startTime;

	const baseline = config.periods.map((period, index) =>
		index >= currentAfterPeriod
			? {
					startTime: period.startTime - lunchDurationMs,
					endTime: period.endTime - lunchDurationMs,
				}
			: period,
	);

	const before = baseline[newAfterPeriod - 1];
	if (!before) {
		return config;
	}

	const lunchStart = before.endTime;
	const lunchEnd = lunchStart + lunchDurationMs;
	const periods = baseline.map((period, index) =>
		index >= newAfterPeriod
			? {
					startTime: period.startTime + lunchDurationMs,
					endTime: period.endTime + lunchDurationMs,
				}
			: period,
	);

	return {
		...config,
		periods,
		lunchBreak: {
			enabled: true,
			afterPeriod: newAfterPeriod,
			startTime: lunchStart,
			endTime: lunchEnd,
		},
	};
}

export function sessionConfigsEqual(
	left: TimetableSessionConfig,
	right: TimetableSessionConfig,
): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

export { extractTimeOfDayMs, MAX_TOTAL_HOURS, MIN_TOTAL_HOURS };
