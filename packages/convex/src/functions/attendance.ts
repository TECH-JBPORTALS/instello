import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as AttendanceRecord from "./model/attendanceRecord";
import * as AttendanceRegister from "./model/attendanceRegister";
import * as AttendanceSession from "./model/attendanceSession";
import * as Class from "./model/class";
import * as Timetable from "./model/timetable";
import { vv } from "./schema";

const TimeContextSchema = {
	now: vv.number(),
	timezoneOffsetMinutes: vv.number(),
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
		return await Promise.all(
			registers.map((register) => AttendanceRegister.toDto(ctx, register)),
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
		sessionDate: vv.string(),
		day: vv.number(),
		startHour: vv.number(),
		endHour: vv.number(),
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

const MarkAttendanceEntrySchema = vv.object({
	studentId: vv.id("students"),
	status: AttendanceRecord.EntryStatusSchema,
});

/** Marks attendance for a session */
export const mark = insMutation({
	permissions: ["attendance:mark"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		sessionDate: vv.string(),
		day: vv.number(),
		startHour: vv.number(),
		endHour: vv.number(),
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

		if (register.status === "archived") {
			throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_ARCHIVED);
		}

		const timetableVersion =
			await AttendanceSession.resolveTimetableVersionForSession(ctx, {
				classId: register.classId,
				sessionDate: args.sessionDate,
				timezoneOffsetMinutes: args.timezoneOffsetMinutes,
			});

		await AttendanceRecord.mark(ctx, {
			register,
			sessionDate: args.sessionDate,
			day: args.day,
			startHour: args.startHour,
			endHour: args.endHour,
			timetableVersion,
			markedBy: ctx.session.userId,
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
