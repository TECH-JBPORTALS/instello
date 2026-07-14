import { insMutation } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Timetable from "../timetable/model/timetable";
import * as TimetableSlot from "../timetable/model/timetableSlot";
import * as TimetableService from "../timetable/service/timetable";
import * as Record from "./model/record";
import * as Register from "./model/register";
import * as Session from "./model/session";
import * as RegisterService from "./service/register";
import { EntryStatusSchema } from "./validator/record";
import { AttendanceSessionDtoSchema } from "./validator/session";

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

const MarkAttendanceEntrySchema = vv.object({
	studentId: vv.id("students"),
	status: EntryStatusSchema,
});

/** Ensures registers exist for the latest timetable (for classes created before attendance) */
export const bootstrapRegisters = insMutation({
	permissions: ["attendance:view"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const cls = await TimetableService.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classSlug,
			institutionId: ctx.institution._id,
		});

		const latest = await Timetable.getLatest(ctx, cls._id);
		if (!latest) {
			return null;
		}

		const slots = await TimetableSlot.listByTimetable(ctx, latest._id);

		await Register.syncFromTimetable(ctx, {
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

/** Marks or updates attendance for a session */
export const mark = insMutation({
	permissions: ["attendance:mark"],
	args: {
		registerId: vv.id("attendanceRegisters"),
		...SessionKeySchema,
		entries: vv.array(MarkAttendanceEntrySchema),
		...TimeContextSchema,
	},
	returns: AttendanceSessionDtoSchema,
	handler: async (ctx, args) => {
		const register = await RegisterService.ensureAccess(
			ctx,
			args.registerId,
			ctx.institution._id,
		);

		const timetableVersion = await Session.resolveTimetableVersionForSession(
			ctx,
			{
				classId: register.classId,
				sessionDate: args.sessionDate,
				timezoneOffsetMinutes: args.timezoneOffsetMinutes,
			},
		);

		await Record.save(ctx, {
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
