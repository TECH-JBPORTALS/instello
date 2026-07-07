import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { sessionWindowMs } from "../helpers/academicSchedule";
import { vv } from "../schema";
import * as AttendanceRecord from "./attendanceRecord";
import type { AttendanceRegisterDto } from "./attendanceRegister";
import * as AttendanceSession from "./attendanceSession";
import type { AppQueryCtx } from "./common.types";

export const SessionDetailsEntrySchema = vv.object({
	studentId: vv.id("students"),
	firstName: vv.string(),
	lastName: vv.string(),
	usn: vv.string(),
	status: AttendanceRecord.EntryStatusSchema,
});

export const SessionDetailsDtoSchema = vv.object({
	session: AttendanceSession.AttendanceSessionDtoSchema,
	register: vv.object({
		subjectName: vv.string(),
		subjectCode: vv.string(),
		subjectColor: vv.string(),
		type: vv.union(vv.literal("theory"), vv.literal("practical")),
		batchLabel: vv.optional(vv.string()),
	}),
	recordId: vv.optional(vv.id("attendanceRecords")),
	presentCount: vv.optional(vv.number()),
	absentCount: vv.optional(vv.number()),
	stats: vv.optional(vv.string()),
	entries: vv.array(SessionDetailsEntrySchema),
	canMark: vv.boolean(),
});

export type SessionDetailsDto = Infer<typeof SessionDetailsDtoSchema>;

export async function getSessionDetails(
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
): Promise<SessionDetailsDto> {
	const session = await AttendanceSession.getSessionForRegister(ctx, {
		register: args.register,
		sessionDate: args.sessionDate,
		day: args.day,
		startHour: args.startHour,
		endHour: args.endHour,
		now: args.now,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
	});

	const record = await AttendanceRecord.findBySessionKey(ctx, {
		registerId: args.register._id,
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
		registerStatus: args.register.status,
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
			subjectName: args.register.subjectName,
			subjectCode: args.register.subjectCode,
			subjectColor: args.register.subjectColor,
			type: args.register.type,
			batchLabel: args.register.batchLabel,
		},
		recordId: record?._id,
		presentCount,
		absentCount,
		stats,
		entries,
		canMark,
	};
}

async function buildEntryDtos(
	ctx: AppQueryCtx,
	recordId: Id<"attendanceRecords">,
) {
	const rows = await AttendanceRecord.listEntriesByRecord(ctx, recordId);

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

function canMarkSession(args: {
	now: number;
	sessionDate: string;
	startHour: number;
	endHour: number;
	timezoneOffsetMinutes: number;
	registerStatus: "active" | "archived";
}): boolean {
	if (args.registerStatus === "archived") {
		return false;
	}

	const { sessionStartMs } = sessionWindowMs({
		sessionDate: args.sessionDate,
		startHour: args.startHour,
		endHour: args.endHour,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
	});

	return args.now >= sessionStartMs;
}

export async function getEntriesForSession(
	ctx: AppQueryCtx,
	args: {
		registerId: Id<"attendanceRegisters">;
		sessionDate: string;
		day: number;
		startHour: number;
		endHour: number;
	},
) {
	const record = await AttendanceRecord.findBySessionKey(ctx, args);
	if (!record) {
		return [];
	}

	return await buildEntryDtos(ctx, record._id);
}
