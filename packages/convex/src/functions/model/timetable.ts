import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import * as Class from "./class";
import * as ClassBatch from "./classBatch";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";
import * as Program from "./program";

export const TOTAL_HOURS = 7;
export const MAX_DAY = 5;

export const SlotInputSchema = vv.object({
	subjectId: vv.id("subjects"),
	batchId: vv.optional(vv.id("classBatches")),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	room: vv.optional(vv.string()),
});

export type SlotInput = Infer<typeof SlotInputSchema>;

export const TimetableSlotDtoSchema = vv.object({
	_id: vv.id("timetableSlots"),
	subject: vv.object({
		_id: vv.id("subjects"),
		name: vv.string(),
		code: vv.string(),
		alias: vv.string(),
		color: vv.string(),
	}),
	batch: vv.optional(
		vv.object({
			_id: vv.id("classBatches"),
			name: vv.string(),
			alias: vv.string(),
			description: vv.string(),
		}),
	),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	room: vv.optional(vv.string()),
});

export const TimetableDtoSchema = vv.object({
	_id: vv.id("timetable"),
	version: vv.number(),
	changeMessage: vv.string(),
	commitedBy: vv.object({
		_id: vv.string(),
		firstName: vv.string(),
		lastName: vv.string(),
	}),
	slots: vv.array(TimetableSlotDtoSchema),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export type TimetableDto = Infer<typeof TimetableDtoSchema>;

export const ProgramTimetableListItemSchema = vv.object({
	class: vv.object({
		_id: vv.id("classes"),
		name: vv.string(),
		slug: vv.string(),
	}),
	timetable: vv.union(TimetableDtoSchema, vv.null()),
});

export type ProgramTimetableListItem = Infer<
	typeof ProgramTimetableListItemSchema
>;

type SlotRange = {
	day: number;
	startHour: number;
	endHour: number;
	batchId?: Id<"classBatches">;
};

function isWithinBounds(slot: SlotRange): boolean {
	return (
		slot.day >= 0 &&
		slot.day <= MAX_DAY &&
		slot.startHour >= 0 &&
		slot.endHour <= TOTAL_HOURS &&
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

export async function resolveClass(
	ctx: AppQueryCtx | AppMutationCtx,
	args: {
		programId: Id<"programs">;
		classAlias: string;
		institutionId: string;
	},
) {
	const program = await Program.getById(
		ctx,
		args.programId,
		args.institutionId,
	);

	if (!program) {
		throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
	}

	const cls = await Class.findBySlug(ctx, args.programId, args.classAlias);

	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	return cls;
}

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

async function listSlots(
	ctx: AppQueryCtx | AppMutationCtx,
	timetableId: Id<"timetable">,
) {
	return await ctx.db
		.query("timetableSlots")
		.withIndex("by_timetable", (q) => q.eq("timetableId", timetableId))
		.collect();
}

export async function toDto(
	ctx: AppQueryCtx | AppMutationCtx,
	timetable: Doc<"timetable">,
): Promise<TimetableDto> {
	const cls = await Class.getById(ctx, timetable.classId);
	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	const convention = cls.batchNamingConvention ?? "numeric";
	const slots = await listSlots(ctx, timetable._id);

	const user = await ctx.runQuery(components.betterAuth.users.getById, {
		userId: timetable.createdBy,
	});
	const { firstName, lastName } = splitUserName(user.name);

	const slotDtos = await Promise.all(
		slots.map(async (slot) => {
			const subject = await ctx.db.get("subjects", slot.subjectId);
			if (!subject) {
				throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
			}

			let batch:
				| {
						_id: Id<"classBatches">;
						name: string;
						alias: string;
						description: string;
				  }
				| undefined;

			if (slot.batchId) {
				const batchDoc = await ClassBatch.getById(ctx, slot.batchId);
				if (!batchDoc) {
					throwAppError(ERROR_CODES.BATCH.NOT_FOUND);
				}
				const label = ClassBatch.getBatchLabel(batchDoc.numIdx, convention);
				batch = {
					_id: batchDoc._id,
					name: label,
					alias: label,
					description: "",
				};
			}

			return {
				_id: slot._id,
				subject: {
					_id: subject._id,
					name: subject.name,
					code: subject.code,
					alias: subject.alias,
					color: subject.color,
				},
				batch,
				day: slot.day,
				startHour: slot.startHour,
				endHour: slot.endHour,
				room: slot.room,
			};
		}),
	);

	return {
		_id: timetable._id,
		version: timetable.version,
		changeMessage: timetable.changeMessage,
		commitedBy: {
			_id: user._id,
			firstName,
			lastName,
		},
		slots: slotDtos,
		createdAt: timetable.createdAt,
		updatedAt: timetable.updatedAt,
	};
}

async function validateSlots(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		institutionId: string;
		slots: SlotInput[];
	},
) {
	for (const slot of args.slots) {
		if (!isWithinBounds(slot)) {
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
		const subject = await ctx.db.get("subjects", slot.subjectId);
		if (!subject || subject.institutionId !== args.institutionId) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		if (slot.batchId) {
			await ClassBatch.ensureInClass(ctx, slot.batchId, args.classId);
		}
	}
}

export async function create(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		institutionId: string;
		createdBy: string;
		changeMessage: string;
		slots: SlotInput[];
	},
): Promise<TimetableDto> {
	await validateSlots(ctx, {
		classId: args.classId,
		institutionId: args.institutionId,
		slots: args.slots,
	});

	const latest = await getLatest(ctx, args.classId);
	const version = latest ? latest.version + 1 : 1;
	const now = Date.now();

	const timetableId = await ctx.db.insert("timetable", {
		classId: args.classId,
		version,
		createdBy: args.createdBy,
		changeMessage: args.changeMessage.trim(),
		effectiveFrom: now,
		createdAt: now,
		updatedAt: now,
	});

	for (const slot of args.slots) {
		await ctx.db.insert("timetableSlots", {
			timetableId,
			subjectId: slot.subjectId,
			batchId: slot.batchId,
			day: slot.day,
			startHour: slot.startHour,
			endHour: slot.endHour,
			room: slot.room,
		});
	}

	const timetable = await ctx.db.get("timetable", timetableId);
	if (!timetable) {
		throwAppError(ERROR_CODES.TIMETABLE.NOT_FOUND);
	}

	return await toDto(ctx, timetable);
}

export async function listLatestByProgram(
	ctx: AppQueryCtx,
	args: {
		programId: Id<"programs">;
		institutionId: string;
	},
): Promise<ProgramTimetableListItem[]> {
	const program = await Program.getById(
		ctx,
		args.programId,
		args.institutionId,
	);

	if (!program) {
		throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
	}

	const classes = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", args.programId))
		.take(50);

	return await Promise.all(
		classes.map(async (cls) => {
			const latest = await getLatest(ctx, cls._id);
			return {
				class: {
					_id: cls._id,
					name: cls.name,
					slug: cls.slug,
				},
				timetable: latest ? await toDto(ctx, latest) : null,
			};
		}),
	);
}
