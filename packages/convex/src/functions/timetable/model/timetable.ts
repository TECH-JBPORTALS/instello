import type { Doc, Id } from "../../_generated/dataModel";
import * as ClassBatch from "../../class/model/classBatch";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import {
	normalizeSessionConfig,
	validateSessionConfig,
} from "../../helpers/timetableSchedule";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import * as Subject from "../../subject/model/subject";
import type { SlotInput, TimetableSessionConfig } from "../validator/timetable";
import * as TimetableSlot from "./timetableSlot";

export const MAX_DAY = 5;

const DELETE_BATCH_SIZE = 40;

type SlotRange = {
	day: number;
	startHour: number;
	endHour: number;
	batchId?: Id<"classBatches">;
};

function isWithinBounds(slot: SlotRange, totalHours: number): boolean {
	return (
		slot.day >= 0 &&
		slot.day <= MAX_DAY &&
		slot.startHour >= 0 &&
		slot.endHour <= totalHours &&
		slot.startHour < slot.endHour
	);
}

function slotsOverlap(a: SlotRange, b: SlotRange): boolean {
	if (a.day !== b.day) return false;
	return a.startHour < b.endHour && a.endHour > b.startHour;
}

function slotsConflict(a: SlotRange, b: SlotRange): boolean {
	if (!slotsOverlap(a, b)) return false;

	const aWholeClass = a.batchId === undefined;
	const bWholeClass = b.batchId === undefined;

	if (aWholeClass || bWholeClass) return true;
	return a.batchId === b.batchId;
}

/** Get timetable document by id. */
export async function getById(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"timetable">,
) {
	return await ctx.db.get("timetable", id);
}

/** Latest timetable version for a class, or null. */
export async function getLatest(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
) {
	return await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) => q.eq("classId", classId))
		.order("desc")
		.first();
}

/** Timetable for a specific version number, or null. */
export async function getByVersion(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
	version: number,
) {
	return await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) =>
			q.eq("classId", classId).eq("version", version),
		)
		.unique();
}

/** All timetable versions for a class, newest first. */
export async function listByClass(
	ctx: AppQueryCtx | AppMutationCtx,
	classId: Id<"classes">,
) {
	return await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) => q.eq("classId", classId))
		.order("desc")
		.collect();
}

async function validateSlots(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		institutionId: string;
		slots: SlotInput[];
		totalHours: number;
	},
) {
	for (const slot of args.slots) {
		if (!isWithinBounds(slot, args.totalHours)) {
			throwAppError(ERROR_CODES.TIMETABLE.INVALID_SLOT);
		}
	}

	for (let i = 0; i < args.slots.length; i++) {
		const a = args.slots[i];
		if (!a) continue;
		for (let j = i + 1; j < args.slots.length; j++) {
			const b = args.slots[j];
			if (!b) continue;
			if (slotsConflict(a, b)) {
				throwAppError(ERROR_CODES.TIMETABLE.SLOT_CONFLICT);
			}
		}
	}

	for (const slot of args.slots) {
		const subject = await Subject.getById(
			ctx,
			slot.subjectId,
			args.institutionId,
		);
		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		if (slot.batchId) {
			await ClassBatch.ensureInClass(ctx, slot.batchId, args.classId);
		}
	}
}

/**
 * Creates a new timetable version with slots.
 * Does not sync attendance registers — callers must orchestrate that.
 */
export async function create(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		institutionId: string;
		createdBy: string;
		changeMessage: string;
		slots: SlotInput[];
		sessionConfig?: TimetableSessionConfig;
	},
): Promise<Doc<"timetable">> {
	const latest = await getLatest(ctx, args.classId);
	const sessionConfig = normalizeSessionConfig(
		args.sessionConfig ?? latest?.sessionConfig,
	);

	const validationErrors = validateSessionConfig(sessionConfig);
	if (validationErrors.length > 0) {
		throwAppError(ERROR_CODES.TIMETABLE.INVALID_SESSION_CONFIG);
	}

	await validateSlots(ctx, {
		classId: args.classId,
		institutionId: args.institutionId,
		slots: args.slots,
		totalHours: sessionConfig.totalHours,
	});

	const version = latest ? latest.version + 1 : 1;
	const now = Date.now();

	const timetableId = await ctx.db.insert("timetable", {
		classId: args.classId,
		version,
		createdBy: args.createdBy,
		changeMessage: args.changeMessage.trim(),
		effectiveFrom: now,
		sessionConfig,
		createdAt: now,
		updatedAt: now,
	});

	await TimetableSlot.insertMany(ctx, timetableId, args.slots);

	const timetable = await getById(ctx, timetableId);
	if (!timetable) {
		throwAppError(ERROR_CODES.TIMETABLE.NOT_FOUND);
	}

	return timetable;
}

/**
 * Deletes timetable versions (and their slots) for a class in bounded batches.
 * Returns `true` when more work remains.
 */
export async function deleteForClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<boolean> {
	const timetables = await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) => q.eq("classId", classId))
		.take(DELETE_BATCH_SIZE);

	if (timetables.length === 0) return false;

	for (const timetable of timetables) {
		const deletedSlots = await TimetableSlot.deleteBatchForTimetable(
			ctx,
			timetable._id,
			DELETE_BATCH_SIZE,
		);
		if (deletedSlots) return true;

		await ctx.db.delete("timetable", timetable._id);
	}

	return true;
}
