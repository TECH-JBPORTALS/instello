import type { Id } from "../_generated/dataModel";
import { sessionWindowMs } from "../helpers/academicSchedule";
import { insQuery } from "../helpers/customFunctions";
import type { TimetableSessionConfig } from "../helpers/timetableSchedule";
import { normalizeSessionConfig } from "../helpers/timetableSchedule";
import type { AppQueryCtx } from "../model/common.types";
import { vv } from "../schema";
import * as TimetableService from "../timetable/service/timetable";
import * as ActivityLog from "./model/activityLog";
import * as Record from "./model/record";
import * as Register from "./model/register";
import * as Session from "./model/session";
import * as RegisterService from "./service/register";
import { ActivityLogDtoSchema } from "./validator/activity";
import {
	SessionDetailsDtoSchema,
	SessionDetailsEntrySchema,
} from "./validator/record";
import { AttendanceRegisterDtoSchema } from "./validator/register";
import {
	AttendanceSessionDtoSchema,
	AttendanceSessionGroupSchema,
} from "./validator/session";

const TimeContextSchema = {
	now: vv.number(),
	timezoneOffsetMinutes: vv.number(),
};

const SessionKeySchema = {
	sessionDate: vv.string(),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
};

function canMarkSession(args: {
	now: number;
	sessionDate: string;
	startHour: number;
	endHour: number;
	timezoneOffsetMinutes: number;
	registerStatus: "active" | "archived";
	sessionConfig?: TimetableSessionConfig;
}): boolean {
	if (args.registerStatus === "archived") {
		return false;
	}

	const { sessionStartMs } = sessionWindowMs({
		sessionDate: args.sessionDate,
		startHour: args.startHour,
		endHour: args.endHour,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
		config: normalizeSessionConfig(args.sessionConfig),
	});

	return args.now >= sessionStartMs;
}

async function buildEntryDtos(
	ctx: AppQueryCtx,
	recordId: Id<"attendanceRecords">,
) {
	const rows = await Record.listEntriesByRecord(ctx, recordId);

	return (
		await Promise.all(
			rows.map(async (entry) => {
				const student = await ctx.db.get("students", entry.studentId);
				if (!student) return null;

				return {
					studentId: entry.studentId,
					firstName: student.firstName,
					lastName: student.lastName,
					usn: student.usn,
					status: entry.status,
				};
			}),
		)
	).filter((entry) => entry !== null);
}

/** Lists active attendance registers for a class */
export const listRegisters = insQuery({
	permissions: ["attendance:view"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
		now: vv.optional(vv.number()),
		timezoneOffsetMinutes: vv.optional(vv.number()),
	},
	returns: vv.array(AttendanceRegisterDtoSchema),
	handler: async (ctx, args) => {
		const cls = await TimetableService.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classSlug,
			institutionId: ctx.institution._id,
		});

		const registers = await Register.listByClass(ctx, cls._id, "active");

		const timeContext =
			args.now !== undefined && args.timezoneOffsetMinutes !== undefined
				? { now: args.now, timezoneOffsetMinutes: args.timezoneOffsetMinutes }
				: undefined;

		return await Promise.all(
			registers.map((register) =>
				RegisterService.toDto(ctx, register, timeContext),
			),
		);
	},
});

/** Gets a single attendance register */
export const getRegister = insQuery({
	permissions: ["attendance:view"],
	args: {
		registerId: vv.id("attendanceRegisters"),
	},
	returns: AttendanceRegisterDtoSchema,
	handler: async (ctx, args) => {
		const register = await RegisterService.ensureAccess(
			ctx,
			args.registerId,
			ctx.institution._id,
		);
		return await RegisterService.toDto(ctx, register);
	},
});

/** Lists virtual sessions grouped by date for a register */
export const listSessions = insQuery({
	permissions: ["attendance:view"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		daysBack: vv.optional(vv.number()),
		...TimeContextSchema,
	},
	returns: vv.array(AttendanceSessionGroupSchema),
	handler: async (ctx, args) => {
		const register = await RegisterService.ensureAccess(
			ctx,
			args.registerId,
			ctx.institution._id,
		);
		const registerDto = await RegisterService.toDto(ctx, register);

		return await Session.listSessionsForRegister(ctx, {
			register: registerDto,
			now: args.now,
			timezoneOffsetMinutes: args.timezoneOffsetMinutes,
			daysBack: args.daysBack,
		});
	},
});

/** Gets a single session with computed status */
export const getSession = insQuery({
	permissions: ["attendance:view"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		...SessionKeySchema,
		...TimeContextSchema,
	},
	returns: AttendanceSessionDtoSchema,
	handler: async (ctx, args) => {
		const register = await RegisterService.ensureAccess(
			ctx,
			args.registerId,
			ctx.institution._id,
		);
		const registerDto = await RegisterService.toDto(ctx, register);

		return await Session.getSessionForRegister(ctx, {
			register: registerDto,
			sessionDate: args.sessionDate,
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
			now: args.now,
			timezoneOffsetMinutes: args.timezoneOffsetMinutes,
		});
	},
});

/** Gets full session details including entries */
export const getSessionDetails = insQuery({
	permissions: ["attendance:view"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		...SessionKeySchema,
		...TimeContextSchema,
	},
	returns: SessionDetailsDtoSchema,
	handler: async (ctx, args) => {
		const register = await RegisterService.ensureAccess(
			ctx,
			args.registerId,
			ctx.institution._id,
		);
		const registerDto = await RegisterService.toDto(ctx, register);

		const session = await Session.getSessionForRegister(ctx, {
			register: registerDto,
			sessionDate: args.sessionDate,
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
			now: args.now,
			timezoneOffsetMinutes: args.timezoneOffsetMinutes,
		});

		const effective = await Session.getEffectiveTimetable(ctx, {
			classId: registerDto.classId,
			sessionDate: args.sessionDate,
			timezoneOffsetMinutes: args.timezoneOffsetMinutes,
		});

		const record = await Record.findBySessionKey(ctx, {
			registerId: args.registerId,
			sessionDate: args.sessionDate,
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
		});

		const entries = record ? await buildEntryDtos(ctx, record._id) : [];

		const canMark = canMarkSession({
			now: args.now,
			sessionDate: args.sessionDate,
			startHour: args.startHour,
			endHour: args.endHour,
			timezoneOffsetMinutes: args.timezoneOffsetMinutes,
			registerStatus: registerDto.status,
			sessionConfig: effective?.sessionConfig,
		});

		let presentCount: number | undefined;
		let absentCount: number | undefined;
		let stats: string | undefined;

		if (record) {
			presentCount = record.presentCount;
			absentCount = record.absentCount;
			const total = record.presentCount + record.absentCount;
			stats = `${record.presentCount}/${total} (${Math.round((record.presentCount / total) * 100)}%)`;
		}

		return {
			session,
			register: {
				subjectName: registerDto.subjectName,
				subjectCode: registerDto.subjectCode,
				subjectColor: registerDto.subjectColor,
				type: registerDto.type,
				batchLabel: registerDto.batchLabel,
			},
			recordId: record?._id,
			presentCount,
			absentCount,
			stats,
			entries,
			canMark,
		};
	},
});

/** Lists activity log entries for a session record */
export const listActivityLog = insQuery({
	permissions: ["attendance:view"],
	args: {
		recordId: vv.id("attendanceRecords"),
	},
	returns: vv.array(ActivityLogDtoSchema),
	handler: async (ctx, args) => {
		await RegisterService.ensureAccessViaRecord(
			ctx,
			args.recordId,
			ctx.institution._id,
		);
		return await ActivityLog.listByRecord(ctx, args.recordId);
	},
});

/** Lists saved attendance entries for a session (for edit pre-fill) */
export const getSessionEntries = insQuery({
	permissions: ["attendance:view"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		...SessionKeySchema,
	},
	returns: vv.array(SessionDetailsEntrySchema),
	handler: async (ctx, args) => {
		await RegisterService.ensureAccess(
			ctx,
			args.registerId,
			ctx.institution._id,
		);

		const record = await Record.findBySessionKey(ctx, {
			registerId: args.registerId,
			sessionDate: args.sessionDate,
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
		});
		if (!record) {
			return [];
		}

		return await buildEntryDtos(ctx, record._id);
	},
});
