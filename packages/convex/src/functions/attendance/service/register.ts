import { components } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import * as Class from "../../class/model/class";
import * as ClassBatch from "../../class/model/classBatch";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import * as ProgramSubject from "../../program/model/programSubject";
import { splitUserName } from "../helpers";
import * as ActivityLog from "../model/activityLog";
import * as Record from "../model/record";
import * as Register from "../model/register";
import * as Session from "../model/session";
import type { AttendanceRegisterDto } from "../validator/register";

export async function ensureAccess(
	ctx: AppQueryCtx | AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
	institutionId: string,
): Promise<Doc<"attendanceRegisters">> {
	const register = await Register.getById(ctx, registerId);
	if (!register) {
		throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
	}

	await Class.ensureInInstitution(ctx, register.classId, institutionId);
	return register;
}

export async function ensureAccessViaRecord(
	ctx: AppQueryCtx | AppMutationCtx,
	recordId: Id<"attendanceRecords">,
	institutionId: string,
): Promise<{
	record: Doc<"attendanceRecords">;
	register: Doc<"attendanceRegisters">;
}> {
	const record = await ctx.db.get("attendanceRecords", recordId);
	if (!record) {
		throwAppError(ERROR_CODES.ATTENDANCE.REGISTER_NOT_FOUND);
	}

	const register = await ensureAccess(ctx, record.registerId, institutionId);
	return { record, register };
}

async function getLatestActivity(
	ctx: AppQueryCtx | AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
) {
	const records = await Record.listRecordsForRegister(ctx, registerId);
	if (records.length === 0) return undefined;

	const latestRecord = records.reduce((latest, record) => {
		const latestTime = latest.updatedAt ?? latest.markedAt;
		const recordTime = record.updatedAt ?? record.markedAt;
		return recordTime > latestTime ? record : latest;
	});

	const latestLog = await ActivityLog.getLatestForRecord(ctx, latestRecord._id);

	if (latestLog) {
		const logs = await ActivityLog.listByRecord(ctx, latestRecord._id);
		const logDto = logs[0];
		if (logDto) {
			return await ActivityLog.toActivitySummary(ctx, logDto);
		}
	}

	const user = await ctx.runQuery(components.betterAuth.users.getById, {
		userId: latestRecord.markedBy,
	});
	const { firstName, lastName } = splitUserName(user.name);
	const name = `${firstName} ${lastName}`.trim();
	const total = latestRecord.presentCount + latestRecord.absentCount;

	return {
		actor: {
			_id: user._id,
			name,
			...(user.image ? { image: user.image } : {}),
		},
		description: `Marked attendance (${latestRecord.presentCount}/${total})`,
		updatedAt: latestRecord.updatedAt ?? latestRecord.markedAt,
	};
}

export async function toDto(
	ctx: AppQueryCtx | AppMutationCtx,
	register: Doc<"attendanceRegisters">,
	options?: {
		now: number;
		timezoneOffsetMinutes: number;
	},
): Promise<AttendanceRegisterDto> {
	const cls = await Class.getById(ctx, register.classId);
	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	const subject = await ctx.db.get("subjects", register.subjectId);
	if (!subject) {
		throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
	}

	const allocation = await ProgramSubject.getForStageAndSubject(ctx, {
		programId: cls.programId as Id<"programs">,
		academicStageId: cls.currentHeadStageId,
		subjectId: register.subjectId,
	});
	const type = allocation?.type ?? "theory";

	let batchLabel: string | undefined;
	if (register.batchId) {
		const batch = await ClassBatch.getById(ctx, register.batchId);
		if (!batch) {
			throwAppError(ERROR_CODES.BATCH.NOT_FOUND);
		}
		const convention = cls.batchNamingConvention ?? "numeric";
		batchLabel = ClassBatch.getBatchLabel(batch.numIdx, convention);
	}

	const activity = await getLatestActivity(ctx, register._id);

	const baseDto = {
		_id: register._id,
		classId: register.classId,
		subjectId: register.subjectId,
		batchId: register.batchId,
		status: register.status,
		subjectName: subject.name,
		subjectCode: subject.code,
		subjectColor: subject.color,
		type,
		batchLabel,
		activity,
		createdAt: register.createdAt,
		updatedAt: register.updatedAt,
	} satisfies AttendanceRegisterDto;

	if (!options) {
		return baseDto;
	}

	const highlight = await Session.getHighlightSessionForRegister(ctx, {
		register: baseDto,
		now: options.now,
		timezoneOffsetMinutes: options.timezoneOffsetMinutes,
	});

	return {
		...baseDto,
		...(highlight
			? {
					currentSession: {
						status: highlight.status,
						hourLabel: highlight.hourLabel,
						timeRange: highlight.timeRange,
						description: highlight.description,
						inGracePeriod: highlight.inGracePeriod,
						sessionDate: highlight.sessionDate,
						day: highlight.day,
						startHour: highlight.startHour,
						endHour: highlight.endHour,
						stats: highlight.stats,
					},
				}
			: {}),
	};
}
