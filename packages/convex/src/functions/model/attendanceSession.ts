import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
	ATTENDANCE_GRACE_PERIOD_MS,
	dayStartMsToSessionDate,
	endOfDayMs,
	formatHourLabel,
	formatTimeRange,
	sessionDateFromNow,
	sessionDateToDayStartMs,
	sessionWindowMs,
	weekdayFromSessionDate,
} from "../helpers/academicSchedule";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import type { AppQueryCtx } from "./common.types";
import * as AttendanceRecord from "./attendanceRecord";
import type { AttendanceRegisterDto } from "./attendanceRegister";

export const SessionStatusSchema = vv.union(
	vv.literal("upcoming"),
	vv.literal("ongoing"),
	vv.literal("completed"),
	vv.literal("missed"),
);

export type SessionStatus = Infer<typeof SessionStatusSchema>;

export const SessionActorSchema = vv.object({
	_id: vv.optional(vv.string()),
	name: vv.string(),
	image: vv.optional(vv.string()),
});

export const AttendanceSessionDtoSchema = vv.object({
	sessionKey: vv.string(),
	sessionDate: vv.string(),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	hourLabel: vv.string(),
	timeRange: vv.string(),
	status: SessionStatusSchema,
	actor: SessionActorSchema,
	description: vv.string(),
	stats: vv.optional(vv.string()),
	updatedAt: vv.optional(vv.number()),
	inGracePeriod: vv.boolean(),
});

export const AttendanceSessionGroupSchema = vv.object({
	id: vv.string(),
	label: vv.string(),
	sessions: vv.array(AttendanceSessionDtoSchema),
});

export type AttendanceSessionDto = Infer<typeof AttendanceSessionDtoSchema>;
export type AttendanceSessionGroup = Infer<typeof AttendanceSessionGroupSchema>;

type SlotOccurrence = {
	day: number;
	startHour: number;
	endHour: number;
};

function splitUserName(name: string): { firstName: string; lastName: string } {
	const trimmed = name.trim();
	const spaceIndex = trimmed.indexOf(" ");
	if (spaceIndex === -1) {
		return { firstName: trimmed, lastName: "" };
	}
	return {
		firstName: trimmed.slice(0, spaceIndex),
		lastName: trimmed.slice(spaceIndex + 1).trim(),
	};
}

function sessionKey(args: {
	sessionDate: string;
	day: number;
	startHour: number;
	endHour: number;
}): string {
	return `${args.sessionDate}:${args.day}:${args.startHour}:${args.endHour}`;
}

export function computeSessionStatus(args: {
	now: number;
	sessionDate: string;
	startHour: number;
	endHour: number;
	timezoneOffsetMinutes: number;
	hasRecord: boolean;
}): { status: SessionStatus; inGracePeriod: boolean } {
	if (args.hasRecord) {
		return { status: "completed", inGracePeriod: false };
	}

	const { sessionStartMs, sessionEndMs } = sessionWindowMs({
		sessionDate: args.sessionDate,
		startHour: args.startHour,
		endHour: args.endHour,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
	});

	if (args.now < sessionStartMs) {
		return { status: "upcoming", inGracePeriod: false };
	}

	if (args.now >= sessionEndMs + ATTENDANCE_GRACE_PERIOD_MS) {
		return { status: "missed", inGracePeriod: false };
	}

	const inGracePeriod =
		args.now >= sessionEndMs &&
		args.now < sessionEndMs + ATTENDANCE_GRACE_PERIOD_MS;

	return { status: "ongoing", inGracePeriod };
}

async function listTimetableVersions(ctx: AppQueryCtx, classId: Id<"classes">) {
	return await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) => q.eq("classId", classId))
		.order("desc")
		.collect();
}

async function listSlotsForTimetable(
	ctx: AppQueryCtx,
	timetableId: Id<"timetable">,
) {
	return await ctx.db
		.query("timetableSlots")
		.withIndex("by_timetable", (q) => q.eq("timetableId", timetableId))
		.collect();
}

export async function getEffectiveTimetable(
	ctx: AppQueryCtx,
	args: {
		classId: Id<"classes">;
		sessionDate: string;
		timezoneOffsetMinutes: number;
	},
) {
	const versions = await listTimetableVersions(ctx, args.classId);
	const dayEndMs = endOfDayMs(args.sessionDate, args.timezoneOffsetMinutes);

	let effective: (typeof versions)[number] | null = null;
	for (const version of versions) {
		if (version.effectiveFrom <= dayEndMs) {
			effective = version;
			break;
		}
	}

	if (!effective) {
		return null;
	}

	const slots = await listSlotsForTimetable(ctx, effective._id);
	return { timetable: effective, slots };
}

function filterSlotsForRegister(
	slots: Array<{
		subjectId: Id<"subjects">;
		batchId?: Id<"classBatches">;
		day: number;
		startHour: number;
		endHour: number;
	}>,
	register: {
		subjectId: Id<"subjects">;
		batchId?: Id<"classBatches">;
	},
	weekday: number,
): SlotOccurrence[] {
	return slots
		.filter(
			(slot) =>
				slot.subjectId === register.subjectId &&
				slot.batchId === register.batchId &&
				slot.day === weekday,
		)
		.map((slot) => ({
			day: slot.day,
			startHour: slot.startHour,
			endHour: slot.endHour,
		}))
		.sort((a, b) => a.startHour - b.startHour);
}

function formatDateLabel(
	sessionDate: string,
	todayDate: string,
	timezoneOffsetMinutes: number,
): string {
	const todayStart = sessionDateToDayStartMs(todayDate, timezoneOffsetMinutes);
	const dateStart = sessionDateToDayStartMs(sessionDate, timezoneOffsetMinutes);
	const diffDays = Math.round((todayStart - dateStart) / (24 * 60 * 60 * 1000));

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";

	const localMs = dateStart - timezoneOffsetMinutes * 60 * 1000;
	const date = new Date(localMs);
	const day = date.getUTCDate();
	const month = date.toLocaleString("en-US", {
		month: "short",
		timeZone: "UTC",
	});
	const weekday = date.toLocaleString("en-US", {
		weekday: "long",
		timeZone: "UTC",
	});
	return `${day}${ordinalSuffix(day)} ${month}, ${weekday}`;
}

function ordinalSuffix(day: number): string {
	if (day >= 11 && day <= 13) return "th";
	switch (day % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}

function defaultActor(): {
	_id?: string;
	name: string;
	image?: string;
} {
	return { name: "Staff" };
}

async function buildSessionDto(
	ctx: AppQueryCtx,
	args: {
		register: AttendanceRegisterDto;
		sessionDate: string;
		occurrence: SlotOccurrence;
		now: number;
		timezoneOffsetMinutes: number;
		record?: Doc<"attendanceRecords">;
	},
): Promise<AttendanceSessionDto> {
	const { status, inGracePeriod } = computeSessionStatus({
		now: args.now,
		sessionDate: args.sessionDate,
		startHour: args.occurrence.startHour,
		endHour: args.occurrence.endHour,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
		hasRecord: args.record !== undefined,
	});

	let actor = defaultActor();
	let description = "is gonna take this class";
	let stats: string | undefined;
	let updatedAt: number | undefined;

	if (args.record) {
		const user = await ctx.runQuery(components.betterAuth.users.getById, {
			userId: args.record.markedBy,
		});
		const { firstName, lastName } = splitUserName(user.name);
		actor = {
			_id: user._id,
			name: `${firstName} ${lastName}`.trim(),
			...(user.image ? { image: user.image } : {}),
		};
		const total = args.record.presentCount + args.record.absentCount;
		stats = `${args.record.presentCount}/${total} (${Math.round((args.record.presentCount / total) * 100)}%)`;
		description = "Marked attendance";
		updatedAt = args.record.markedAt;
	} else if (status === "ongoing" && inGracePeriod) {
		description = "likely forgot to mark the attendance";
	} else if (status === "ongoing") {
		description = "in the class";
	} else if (status === "missed") {
		description = "Attendance was not marked in time";
	}

	return {
		sessionKey: sessionKey({
			sessionDate: args.sessionDate,
			day: args.occurrence.day,
			startHour: args.occurrence.startHour,
			endHour: args.occurrence.endHour,
		}),
		sessionDate: args.sessionDate,
		day: args.occurrence.day,
		startHour: args.occurrence.startHour,
		endHour: args.occurrence.endHour,
		hourLabel: formatHourLabel(
			args.occurrence.startHour,
			args.occurrence.endHour,
		),
		timeRange: formatTimeRange(
			args.occurrence.startHour,
			args.occurrence.endHour,
		),
		status,
		actor,
		description,
		stats,
		updatedAt,
		inGracePeriod,
	};
}

export async function listSessionsForRegister(
	ctx: AppQueryCtx,
	args: {
		register: AttendanceRegisterDto;
		now: number;
		timezoneOffsetMinutes: number;
		daysBack?: number;
	},
): Promise<AttendanceSessionGroup[]> {
	const daysBack = args.daysBack ?? 14;
	const todayDate = sessionDateFromNow(args.now, args.timezoneOffsetMinutes);
	const todayStartMs = sessionDateToDayStartMs(
		todayDate,
		args.timezoneOffsetMinutes,
	);

	const groups: AttendanceSessionGroup[] = [];

	for (let offset = 0; offset <= daysBack; offset++) {
		const dayStartMs = todayStartMs - offset * 24 * 60 * 60 * 1000;
		const sessionDate = dayStartMsToSessionDate(
			dayStartMs,
			args.timezoneOffsetMinutes,
		);
		const weekday = weekdayFromSessionDate(
			sessionDate,
			args.timezoneOffsetMinutes,
		);

		const effective = await getEffectiveTimetable(ctx, {
			classId: args.register.classId,
			sessionDate,
			timezoneOffsetMinutes: args.timezoneOffsetMinutes,
		});

		if (!effective) continue;

		const occurrences = filterSlotsForRegister(
			effective.slots,
			args.register,
			weekday,
		);
		if (occurrences.length === 0) continue;

		const records = await AttendanceRecord.listRecordsForRegisterOnDate(
			ctx,
			args.register._id,
			sessionDate,
		);
		const recordByKey = new Map(
			records.map((record) => [
				sessionKey({
					sessionDate: record.sessionDate,
					day: record.day,
					startHour: record.startHour,
					endHour: record.endHour,
				}),
				record,
			]),
		);

		const sessions = await Promise.all(
			occurrences.map((occurrence) =>
				buildSessionDto(ctx, {
					register: args.register,
					sessionDate,
					occurrence,
					now: args.now,
					timezoneOffsetMinutes: args.timezoneOffsetMinutes,
					record: recordByKey.get(
						sessionKey({
							sessionDate,
							day: occurrence.day,
							startHour: occurrence.startHour,
							endHour: occurrence.endHour,
						}),
					),
				}),
			),
		);

		groups.push({
			id: sessionDate,
			label: formatDateLabel(
				sessionDate,
				todayDate,
				args.timezoneOffsetMinutes,
			),
			sessions,
		});
	}

	return groups;
}

export async function getSessionForRegister(
	ctx: AppQueryCtx,
	args: {
		register: AttendanceRegisterDto;
		sessionDate: string;
		day: number;
		startHour: number;
		endHour: number;
		now: number;
		timezoneOffsetMinutes: number;
	},
): Promise<AttendanceSessionDto> {
	const record = await AttendanceRecord.findBySessionKey(ctx, {
		registerId: args.register._id,
		sessionDate: args.sessionDate,
		day: args.day,
		startHour: args.startHour,
		endHour: args.endHour,
	});

	return await buildSessionDto(ctx, {
		register: args.register,
		sessionDate: args.sessionDate,
		occurrence: {
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
		},
		now: args.now,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
		record: record ?? undefined,
	});
}

export async function resolveTimetableVersionForSession(
	ctx: AppQueryCtx,
	args: {
		classId: Id<"classes">;
		sessionDate: string;
		timezoneOffsetMinutes: number;
	},
): Promise<number> {
	const effective = await getEffectiveTimetable(ctx, args);
	if (!effective) {
		throwAppError(ERROR_CODES.TIMETABLE.NOT_FOUND);
	}
	return effective.timetable.version;
}
