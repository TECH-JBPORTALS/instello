import * as Class from "./class/model/class";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as AttendanceActivityLog from "./model/attendanceActivityLog";
import * as AttendanceRecord from "./model/attendanceRecord";
import * as AttendanceRegister from "./model/attendanceRegister";
import * as AttendanceSession from "./model/attendanceSession";
import * as AttendanceSessionDetails from "./model/attendanceSessionDetails";
import * as Timetable from "./model/timetable";
import { vv } from "./schema";

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

/** Ensures registers exist for the latest timetable (for classes created before attendance) */
export const bootstrapRegisters = insMutation({
	permissions: ["attendance:view"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const cls = await Timetable.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classSlug,
			institutionId: ctx.institution._id,
		});

		const latest = await Timetable.getLatest(ctx, cls._id);
		if (!latest) {
			return null;
		}

		const slots = await ctx.db
			.query("timetableSlots")
			.withIndex("by_timetable", (q) => q.eq("timetableId", latest._id))
			.collect();

		await AttendanceRegister.syncFromTimetable(ctx, {
			classId: cls._id,
			slots: slots.map((slot) => ({
				subjectId: slot.subjectId,
				batchId: slot.batchId,
				day: slot.day,
				startHour: slot.startHour,
				endHour: slot.endHour,
				room: slot.room,
			})),
		});

		return null;
	},
});

/** Lists active attendance registers for a class */
export const listRegisters = insQuery({
	permissions: ["attendance:view"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
		now: vv.optional(vv.number()),
		timezoneOffsetMinutes: vv.optional(vv.number()),
	},
	returns: vv.array(AttendanceRegister.AttendanceRegisterDtoSchema),
	handler: async (ctx, args) => {
		const cls = await Timetable.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classSlug,
			institutionId: ctx.institution._id,
		});

		const registers = await AttendanceRegister.listByClass(
			ctx,
			cls._id,
			"active",
		);

		const timeContext =
			args.now !== undefined && args.timezoneOffsetMinutes !== undefined
				? { now: args.now, timezoneOffsetMinutes: args.timezoneOffsetMinutes }
				: undefined;

		return await Promise.all(
			registers.map((register) =>
				AttendanceRegister.toDto(ctx, register, timeContext),
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
	returns: AttendanceRegister.AttendanceRegisterDtoSchema,
	handler: async (ctx, args) => {
		const register = await AttendanceRegister.getById(ctx, args.registerId);
		if (!register) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, register.classId, ctx.institution._id);

		return await AttendanceRegister.toDto(ctx, register);
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
	returns: vv.array(AttendanceSession.AttendanceSessionGroupSchema),
	handler: async (ctx, args) => {
		const register = await AttendanceRegister.getById(ctx, args.registerId);
		if (!register) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, register.classId, ctx.institution._id);

		const registerDto = await AttendanceRegister.toDto(ctx, register);

		return await AttendanceSession.listSessionsForRegister(ctx, {
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
	returns: AttendanceSession.AttendanceSessionDtoSchema,
	handler: async (ctx, args) => {
		const register = await AttendanceRegister.getById(ctx, args.registerId);
		if (!register) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, register.classId, ctx.institution._id);

		const registerDto = await AttendanceRegister.toDto(ctx, register);

		return await AttendanceSession.getSessionForRegister(ctx, {
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
	returns: AttendanceSessionDetails.SessionDetailsDtoSchema,
	handler: async (ctx, args) => {
		const register = await AttendanceRegister.getById(ctx, args.registerId);
		if (!register) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, register.classId, ctx.institution._id);

		const registerDto = await AttendanceRegister.toDto(ctx, register);

		return await AttendanceSessionDetails.getSessionDetails(ctx, {
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

/** Lists activity log entries for a session record */
export const listActivityLog = insQuery({
	permissions: ["attendance:view"],
	args: {
		recordId: vv.id("attendanceRecords"),
	},
	returns: vv.array(AttendanceActivityLog.ActivityLogDtoSchema),
	handler: async (ctx, args) => {
		const record = await ctx.db.get("attendanceRecords", args.recordId);
		if (!record) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		const register = await AttendanceRegister.getById(ctx, record.registerId);
		if (!register) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, register.classId, ctx.institution._id);

		return await AttendanceActivityLog.listByRecord(ctx, args.recordId);
	},
});

/** Lists saved attendance entries for a session (for edit pre-fill) */
export const getSessionEntries = insQuery({
	permissions: ["attendance:view"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		...SessionKeySchema,
	},
	returns: vv.array(AttendanceSessionDetails.SessionDetailsEntrySchema),
	handler: async (ctx, args) => {
		const register = await AttendanceRegister.getById(ctx, args.registerId);
		if (!register) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, register.classId, ctx.institution._id);

		return await AttendanceSessionDetails.getEntriesForSession(ctx, {
			registerId: args.registerId,
			sessionDate: args.sessionDate,
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
		});
	},
});

const MarkAttendanceEntrySchema = vv.object({
	studentId: vv.id("students"),
	status: AttendanceRecord.EntryStatusSchema,
});

/** Marks or updates attendance for a session */
export const mark = insMutation({
	permissions: ["attendance:mark"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		...SessionKeySchema,
		entries: vv.array(MarkAttendanceEntrySchema),
		...TimeContextSchema,
	},
	returns: AttendanceSession.AttendanceSessionDtoSchema,
	handler: async (ctx, args) => {
		const register = await AttendanceRegister.getById(ctx, args.registerId);
		if (!register) {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, register.classId, ctx.institution._id);

		const timetableVersion =
			await AttendanceSession.resolveTimetableVersionForSession(ctx, {
				classId: register.classId,
				sessionDate: args.sessionDate,
				timezoneOffsetMinutes: args.timezoneOffsetMinutes,
			});

		await AttendanceRecord.save(ctx, {
			register,
			sessionDate: args.sessionDate,
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
			timetableVersion,
			performedBy: ctx.session.userId,
			now: args.now,
			timezoneOffsetMinutes: args.timezoneOffsetMinutes,
			entries: args.entries,
		});

		const registerDto = await AttendanceRegister.toDto(ctx, register);

		return await AttendanceSession.getSessionForRegister(ctx, {
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
