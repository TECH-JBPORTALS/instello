import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import * as Class from "../class/model/class";
import * as ClassBatch from "../class/model/classBatch";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import * as ProgramSubject from "../program/model/programSubject";
import { vv } from "../schema";
import * as AttendanceActivityLog from "./attendanceActivityLog";
import * as AttendanceSession from "./attendanceSession";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";
import type { SlotInput } from "./timetable";

export const RegisterStatusSchema = vv.union(
	vv.literal("active"),
	vv.literal("archived"),
);

export const RegisterActivitySchema = vv.object({
	actor: vv.object({
		_id: vv.string(),
		name: vv.string(),
		image: vv.optional(vv.string()),
	}),
	description: vv.string(),
	updatedAt: vv.number(),
});

export const RegisterCurrentSessionSchema = vv.object({
	status: AttendanceSession.SessionStatusSchema,
	hourLabel: vv.string(),
	timeRange: vv.string(),
	description: vv.string(),
	inGracePeriod: vv.boolean(),
	sessionDate: vv.string(),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	stats: vv.optional(vv.string()),
});

export const AttendanceRegisterDtoSchema = vv.object({
	_id: vv.id("attendanceRegisters"),
	classId: vv.id("classes"),
	subjectId: vv.id("subjects"),
	batchId: vv.optional(vv.id("classBatches")),
	status: RegisterStatusSchema,
	subjectName: vv.string(),
	subjectCode: vv.string(),
	subjectColor: vv.string(),
	type: vv.union(vv.literal("theory"), vv.literal("practical")),
	batchLabel: vv.optional(vv.string()),
	activity: vv.optional(RegisterActivitySchema),
	currentSession: vv.optional(RegisterCurrentSessionSchema),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export type AttendanceRegisterDto = Infer<typeof AttendanceRegisterDtoSchema>;

export type SubjectBatchCombo = {
	subjectId: Id<"subjects">;
	batchId?: Id<"classBatches">;
};

function comboKey(combo: SubjectBatchCombo): string {
	return `${combo.subjectId}:${combo.batchId ?? "whole"}`;
}

export function extractUniqueCombos(slots: SlotInput[]): SubjectBatchCombo[] {
	const seen = new Set<string>();
	const combos: SubjectBatchCombo[] = [];

	for (const slot of slots) {
		const combo: SubjectBatchCombo = {
			subjectId: slot.subjectId,
			...(slot.batchId ? { batchId: slot.batchId } : {}),
		};
		const key = comboKey(combo);
		if (seen.has(key)) continue;
		seen.add(key);
		combos.push(combo);
	}

	return combos;
}

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

export async function getById(
	ctx: AppQueryCtx | AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
) {
	return await ctx.db.get("attendanceRegisters", registerId);
}

async function findByCombo(
	ctx: AppQueryCtx | AppMutationCtx,
	args: {
		classId: Id<"classes">;
		subjectId: Id<"subjects">;
		batchId?: Id<"classBatches">;
	},
) {
	return await ctx.db
		.query("attendanceRegisters")
		.withIndex("by_class_subject_batch", (q) =>
			q
				.eq("classId", args.classId)
				.eq("subjectId", args.subjectId)
				.eq("batchId", args.batchId),
		)
		.unique();
}

export async function listByClass(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
	status?: "active" | "archived",
) {
	if (status) {
		return await ctx.db
			.query("attendanceRegisters")
			.withIndex("by_class_and_status", (q) =>
				q.eq("classId", classId).eq("status", status),
			)
			.collect();
	}

	return await ctx.db
		.query("attendanceRegisters")
		.withIndex("by_class_and_status", (q) => q.eq("classId", classId))
		.collect();
}

export async function syncFromTimetable(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		slots: SlotInput[];
	},
) {
	const combos = extractUniqueCombos(args.slots);
	const comboKeys = new Set(combos.map(comboKey));
	const now = Date.now();

	const existing = await listByClass(ctx, args.classId);

	for (const combo of combos) {
		const register = await findByCombo(ctx, {
			classId: args.classId,
			subjectId: combo.subjectId,
			batchId: combo.batchId,
		});

		if (!register) {
			await ctx.db.insert("attendanceRegisters", {
				classId: args.classId,
				subjectId: combo.subjectId,
				batchId: combo.batchId,
				status: "active",
				createdAt: now,
				updatedAt: now,
			});
			continue;
		}

		if (register.status === "archived") {
			await ctx.db.patch("attendanceRegisters", register._id, {
				status: "active",
				archivedAt: undefined,
				updatedAt: now,
			});
		}
	}

	for (const register of existing) {
		const key = comboKey({
			subjectId: register.subjectId,
			batchId: register.batchId,
		});
		if (comboKeys.has(key) || register.status === "archived") {
			continue;
		}

		await ctx.db.patch("attendanceRegisters", register._id, {
			status: "archived",
			archivedAt: now,
			updatedAt: now,
		});
	}
}

import * as AttendanceRecord from "./attendanceRecord";

async function getLatestActivity(
	ctx: AppQueryCtx | AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
) {
	const records = await AttendanceRecord.listRecordsForRegister(
		ctx,
		registerId,
	);
	if (records.length === 0) return undefined;

	const latestRecord = records.reduce((latest, record) => {
		const latestTime = latest.updatedAt ?? latest.markedAt;
		const recordTime = record.updatedAt ?? record.markedAt;
		return recordTime > latestTime ? record : latest;
	});

	const latestLog = await AttendanceActivityLog.getLatestForRecord(
		ctx,
		latestRecord._id,
	);

	if (latestLog) {
		const logs = await AttendanceActivityLog.listByRecord(
			ctx,
			latestRecord._id,
		);
		const logDto = logs[0];
		if (logDto) {
			return await AttendanceActivityLog.toActivitySummary(ctx, logDto);
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

	const highlight = await AttendanceSession.getHighlightSessionForRegister(
		ctx,
		{
			register: baseDto,
			now: options.now,
			timezoneOffsetMinutes: options.timezoneOffsetMinutes,
		},
	);

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
