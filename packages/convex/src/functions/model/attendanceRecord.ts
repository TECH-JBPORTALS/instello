import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import {
	ATTENDANCE_GRACE_PERIOD_MS,
	sessionWindowMs,
} from "../helpers/academicSchedule";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const EntryStatusSchema = vv.union(
	vv.literal("present"),
	vv.literal("absent"),
);

export const MarkEntryInputSchema = vv.object({
	studentId: vv.id("students"),
	status: EntryStatusSchema,
});

export type MarkEntryInput = Infer<typeof MarkEntryInputSchema>;

export async function findBySessionKey(
	ctx: AppQueryCtx | AppMutationCtx,
	args: {
		registerId: Id<"attendanceRegisters">;
		sessionDate: string;
		day: number;
		startHour: number;
		endHour: number;
	},
) {
	return await ctx.db
		.query("attendanceRecords")
		.withIndex("by_register_session_key", (q) =>
			q
				.eq("registerId", args.registerId)
				.eq("sessionDate", args.sessionDate)
				.eq("day", args.day)
				.eq("startHour", args.startHour)
				.eq("endHour", args.endHour),
		)
		.unique();
}

export async function listEntriesByRecord(
	ctx: AppQueryCtx | AppMutationCtx,
	recordId: Id<"attendanceRecords">,
) {
	return await ctx.db
		.query("attendanceEntries")
		.withIndex("by_record", (q) => q.eq("recordId", recordId))
		.collect();
}

export async function listRecordsForRegisterOnDate(
	ctx: AppQueryCtx | AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
	sessionDate: string,
) {
	return await ctx.db
		.query("attendanceRecords")
		.withIndex("by_register_and_sessionDate", (q) =>
			q.eq("registerId", registerId).eq("sessionDate", sessionDate),
		)
		.collect();
}

export function assertMarkableWindow(args: {
	now: number;
	sessionDate: string;
	startHour: number;
	endHour: number;
	timezoneOffsetMinutes: number;
}) {
	const { sessionStartMs, sessionEndMs } = sessionWindowMs({
		sessionDate: args.sessionDate,
		startHour: args.startHour,
		endHour: args.endHour,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
	});

	if (args.now < sessionStartMs) {
		throwAppError(ERROR_CODES.ATTENDANCE.SESSION_NOT_MARKABLE);
	}

	if (args.now >= sessionEndMs + ATTENDANCE_GRACE_PERIOD_MS) {
		throwAppError(ERROR_CODES.ATTENDANCE.SESSION_NOT_MARKABLE);
	}
}

export async function validateStudentsForRegister(
	ctx: AppMutationCtx,
	args: {
		register: Doc<"attendanceRegisters">;
		entries: MarkEntryInput[];
	},
) {
	const studentIds = new Set(args.entries.map((entry) => entry.studentId));

	for (const studentId of studentIds) {
		const student = await ctx.db.get("students", studentId);
		if (!student || student.classId !== args.register.classId) {
			throwAppError(ERROR_CODES.ATTENDANCE.INVALID_STUDENT);
		}

		if (args.register.batchId) {
			if (student.batchId !== args.register.batchId) {
				throwAppError(ERROR_CODES.ATTENDANCE.INVALID_STUDENT);
			}
		}
	}
}

export async function mark(
	ctx: AppMutationCtx,
	args: {
		register: Doc<"attendanceRegisters">;
		sessionDate: string;
		day: number;
		startHour: number;
		endHour: number;
		timetableVersion: number;
		markedBy: string;
		now: number;
		timezoneOffsetMinutes: number;
		entries: MarkEntryInput[];
	},
): Promise<Doc<"attendanceRecords">> {
	if (args.register.status === "archived") {
		throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_ARCHIVED);
	}

	const existing = await findBySessionKey(ctx, {
		registerId: args.register._id,
		sessionDate: args.sessionDate,
		day: args.day,
		startHour: args.startHour,
		endHour: args.endHour,
	});
	if (existing) {
		throwAppError(ERROR_CODES.ATTENDANCE.SESSION_ALREADY_MARKED);
	}

	assertMarkableWindow({
		now: args.now,
		sessionDate: args.sessionDate,
		startHour: args.startHour,
		endHour: args.endHour,
		timezoneOffsetMinutes: args.timezoneOffsetMinutes,
	});

	await validateStudentsForRegister(ctx, {
		register: args.register,
		entries: args.entries,
	});

	let presentCount = 0;
	let absentCount = 0;
	for (const entry of args.entries) {
		if (entry.status === "present") {
			presentCount++;
		} else {
			absentCount++;
		}
	}

	const recordId = await ctx.db.insert("attendanceRecords", {
		registerId: args.register._id,
		sessionDate: args.sessionDate,
		day: args.day,
		startHour: args.startHour,
		endHour: args.endHour,
		timetableVersion: args.timetableVersion,
		markedBy: args.markedBy,
		markedAt: args.now,
		presentCount,
		absentCount,
	});

	for (const entry of args.entries) {
		await ctx.db.insert("attendanceEntries", {
			recordId,
			studentId: entry.studentId,
			status: entry.status,
		});
	}

	const record = await ctx.db.get("attendanceRecords", recordId);
	if (!record) {
		throwAppError(ERROR_CODES.ATTENDANCE.SESSION_NOT_MARKABLE);
	}

	return record;
}
