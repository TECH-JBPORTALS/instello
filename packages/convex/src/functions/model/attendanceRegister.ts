import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import * as Class from "./class";
import * as ClassBatch from "./classBatch";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";
import * as ProgramSubject from "./programSubject";
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

async function getLatestActivity(
	ctx: AppQueryCtx | AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
) {
	const records = await ctx.db
		.query("attendanceRecords")
		.withIndex("by_register_and_sessionDate", (q) =>
			q.eq("registerId", registerId),
		)
		.order("desc")
		.take(1);

	const record = records[0];
	if (!record) return undefined;

	const user = await ctx.runQuery(components.betterAuth.users.getById, {
		userId: record.markedBy,
	});
	const { firstName, lastName } = splitUserName(user.name);
	const name = `${firstName} ${lastName}`.trim();
	const total = record.presentCount + record.absentCount;

	return {
		actor: {
			_id: user._id,
			name,
			...(user.image ? { image: user.image } : {}),
		},
		description: `Marked attendance (${record.presentCount}/${total})`,
		updatedAt: record.markedAt,
	};
}

export async function toDto(
	ctx: AppQueryCtx | AppMutationCtx,
	register: Doc<"attendanceRegisters">,
): Promise<AttendanceRegisterDto> {
	const cls = await Class.getById(ctx, register.classId);
	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	const subject = await ctx.db.get("subjects", register.subjectId);
	if (!subject) {
		throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
	}

	const programSubjects = await ProgramSubject.listByStage(ctx, {
		programId: cls.programId as Id<"programs">,
		academicStageId: cls.currentHeadStageId,
	});
	const allocation = programSubjects.find(
		(item) => item.subject._id === register.subjectId,
	);
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

	return {
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
	};
}
