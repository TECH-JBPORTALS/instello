import { describe, expect, it } from "vitest";
import {
	buildDefaultPeriods,
	DEFAULT_TIMETABLE_SESSION_CONFIG,
	extractTimeOfDayMs,
	formatPeriodTimeRange,
	formatTimeOfDay,
	normalizeSessionConfig,
	sessionWindowMs,
	validateSessionConfig,
} from "./timetableSchedule";

describe("timetableSchedule", () => {
	it("builds default 7 x 45-minute periods from 9:00", () => {
		const config = DEFAULT_TIMETABLE_SESSION_CONFIG;

		expect(config.totalHours).toBe(7);
		expect(config.periods).toHaveLength(7);
		expect(formatTimeOfDay(config.periods[0]?.startTime ?? 0)).toBe("9am");
		expect(formatPeriodTimeRange(config, 0, 1)).toBe("9am - 9:45am");
	});

	it("validates non-overlapping periods", () => {
		const config = normalizeSessionConfig({
			totalHours: 4,
			periods: buildDefaultPeriods(4),
		});

		expect(validateSessionConfig(config)).toEqual([]);
	});

	it("rejects overlapping periods", () => {
		const periods = buildDefaultPeriods(4);
		const second = periods[1];
		if (!second) {
			throw new Error("Missing second period");
		}

		const config = normalizeSessionConfig({
			totalHours: 4,
			periods: [
				// biome-ignore lint/style/noNonNullAssertion: <Periods are guaranteed to be defined>
				periods[0]!,
				{
					startTime: periods[0]?.startTime,
					endTime: second.endTime,
				},
				// biome-ignore lint/style/noNonNullAssertion: <Periods are guaranteed to be defined>
				periods[2]!,
				// biome-ignore lint/style/noNonNullAssertion: <Periods are guaranteed to be defined>
				periods[3]!,
			],
		});

		expect(validateSessionConfig(config).length).toBeGreaterThan(0);
	});

	it("maps session windows from catalog times", () => {
		const config = DEFAULT_TIMETABLE_SESSION_CONFIG;
		const { sessionStartMs, sessionEndMs } = sessionWindowMs({
			config,
			sessionDate: "2026-07-07",
			startHour: 0,
			endHour: 1,
			timezoneOffsetMinutes: 0,
		});

		expect(sessionEndMs - sessionStartMs).toBe(
			extractTimeOfDayMs(config.periods[0]?.endTime) -
				extractTimeOfDayMs(config.periods[0]?.startTime),
		);
	});

	it("accounts for lunch gap in later periods", () => {
		const periods = buildDefaultPeriods(4);
		const afterPeriod = 2;
		const lunchDurationMs = 45 * 60 * 1000;
		const lunchStart = periods[afterPeriod - 1]?.endTime;
		const shiftedPeriods = periods.map((period, index) => {
			if (index < afterPeriod) {
				return period;
			}
			return {
				startTime: period.startTime + lunchDurationMs,
				endTime: period.endTime + lunchDurationMs,
			};
		});
		const config = normalizeSessionConfig({
			totalHours: 4,
			periods: shiftedPeriods,
			lunchBreak: {
				enabled: true,
				afterPeriod,
				startTime: lunchStart,
				endTime: lunchStart + lunchDurationMs,
			},
		});

		const beforeLunchEnd = sessionWindowMs({
			config,
			sessionDate: "2026-07-07",
			startHour: 1,
			endHour: 2,
			timezoneOffsetMinutes: 0,
		});

		const afterLunchStart = sessionWindowMs({
			config,
			sessionDate: "2026-07-07",
			startHour: 2,
			endHour: 3,
			timezoneOffsetMinutes: 0,
		});

		expect(afterLunchStart.sessionStartMs).toBeGreaterThan(
			beforeLunchEnd.sessionEndMs,
		);
	});
});
