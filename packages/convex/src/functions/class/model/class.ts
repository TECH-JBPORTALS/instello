import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import * as AcademicStage from "../../academicPattern/model/academicStage";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import { slugifyName } from "../../helpers/slug";
import * as InstitutionAcademicPattern from "../../institution/model/institutionAcademicPattern";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import * as Program from "../../program/model/program";
import type {
	ClassDto,
	ClassListItem,
	ClassStageSummary,
	CreateBodySchema,
	PaginatedClassList,
	PatchBasicInfoSchema,
} from "../validator/class";

export type {
	ClassDto,
	ClassListItem,
	ClassStageSummary,
	PaginatedClassList,
} from "../validator/class";
export {
	ClassDtoSchema,
	ClassListItemSchema,
	CreateBodySchema,
	CreateInputSchema,
	PaginatedClassListSchema,
	PatchBasicInfoSchema,
} from "../validator/class";

const DELETE_BATCH_SIZE = 40;

export function isLive(cls: Doc<"classes">) {
	return cls.isDeleting !== true;
}

function toStageSummary(stage: Doc<"academicStages">): ClassStageSummary {
	return {
		_id: stage._id,
		name: stage.name,
		alias: stage.alias,
		sequenceNumber: stage.sequenceNumber,
	};
}

/** Converts a class to a DTO. */
export async function toDto(
	ctx: AppQueryCtx,
	cls: Doc<"classes">,
): Promise<ClassDto> {
	const stage = await ctx.db.get("academicStages", cls.currentHeadStageId);

	if (!stage) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
	}

	return {
		_id: cls._id,
		name: cls.name,
		slug: cls.slug,
		description: cls.description,
		isGroupsEnabled: cls.isGroupsEnabled,
		batchNamingConvention: cls.batchNamingConvention,
		status: cls.status,
		currentHeadStage: toStageSummary(stage),
		createdAt: cls.createdAt,
		updatedAt: cls.updatedAt,
	};
}

async function toListItem(
	ctx: AppQueryCtx,
	cls: Doc<"classes">,
): Promise<ClassListItem> {
	const stage = await ctx.db.get("academicStages", cls.currentHeadStageId);

	if (!stage) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
	}

	return {
		_id: cls._id,
		name: cls.name,
		slug: cls.slug,
		description: cls.description,
		status: cls.status,
		currentHeadStage: toStageSummary(stage),
	};
}

/** Verifies the stage belongs to the institution's adopted academic pattern. */
export async function validateHeadStage(
	ctx: AppQueryCtx | AppMutationCtx,
	args: {
		institutionId: string;
		stageId: Id<"academicStages">;
	},
) {
	const adoption = await InstitutionAcademicPattern.getByInstitution(
		ctx,
		args.institutionId,
	);

	if (!adoption) {
		throwAppError(ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.NOT_FOUND);
	}

	const stage = await AcademicStage.getById(
		ctx,
		args.stageId,
		adoption.academicPatternId,
	);

	if (!stage) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
	}

	return stage;
}

/** Find class by slug and programId */
export async function findBySlug(
	ctx: AppQueryCtx | AppMutationCtx,
	programId: Id<"programs">,
	slug: string,
) {
	const cls = await ctx.db
		.query("classes")
		.withIndex("by_program_and_slug", (q) =>
			q.eq("programId", programId).eq("slug", slug),
		)
		.unique();

	if (!cls || !isLive(cls)) return null;

	return cls;
}

/** Find programs by name */
export async function findByName(
	ctx: AppQueryCtx | AppMutationCtx,
	programId: Id<"programs">,
	name: string,
) {
	const trimmedName = name.trim();
	const classes = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", programId))
		.collect();

	return (
		classes.find(
			(cls) =>
				isLive(cls) &&
				cls.name.trim().toLowerCase() === trimmedName.toLowerCase(),
		) ?? null
	);
}

function normalizeClassSlug(slug: string): string {
	try {
		return slugifyName(slug);
	} catch {
		throwAppError(ERROR_CODES.CLASS.INVALID_SLUG);
	}
}

/** Normalize class slug for check */
export function normalizeClassSlugForCheck(slug: string): string {
	return slugifyName(slug);
}

/** Assert name and slug are available */
async function assertNameAndSlugAvailable(
	ctx: AppMutationCtx,
	programId: Id<"programs">,
	args: { name: string; slug: string; excludeId?: Id<"classes"> },
) {
	const trimmedName = args.name.trim();
	const slug = normalizeClassSlug(args.slug);

	const existingByName = await findByName(ctx, programId, trimmedName);
	if (existingByName && existingByName._id !== args.excludeId) {
		throwAppError(ERROR_CODES.CLASS.NAME_ALREADY_EXISTS);
	}

	const existingBySlug = await findBySlug(ctx, programId, slug);
	if (existingBySlug && existingBySlug._id !== args.excludeId) {
		throwAppError(ERROR_CODES.CLASS.SLUG_ALREADY_EXISTS);
	}

	return { name: trimmedName, slug };
}

/** Create class */
export async function create(
	ctx: AppMutationCtx,
	args: {
		programId: Id<"programs">;
		body: Infer<typeof CreateBodySchema>;
	},
) {
	const now = Date.now();
	const { name, slug } = await assertNameAndSlugAvailable(ctx, args.programId, {
		name: args.body.name,
		slug: args.body.slug,
	});

	return await ctx.db.insert("classes", {
		programId: args.programId,
		name,
		slug,
		description: args.body.description?.trim(),
		currentHeadStageId: args.body.currentHeadStageId,
		createdAt: now,
		updatedAt: now,
		status: "active",
		isGroupsEnabled: false,
	});
}

/** List classes */
export async function list(
	ctx: AppQueryCtx,
	args: {
		programId: Id<"programs">;
		query?: string | null;
		paginationOpts: PaginationOptions;
	},
): Promise<PaginatedClassList> {
	const searchTerm = args.query?.trim();

	if (searchTerm) {
		const normalizedQuery = searchTerm.toLowerCase();
		const result = await ctx.db
			.query("classes")
			.withIndex("by_program", (q) => q.eq("programId", args.programId))
			.order("asc")
			.paginate({ numItems: 100, cursor: null });

		const filtered = result.page.filter(
			(cls) => isLive(cls) && cls.name.toLowerCase().includes(normalizedQuery),
		);
		const page = await Promise.all(filtered.map((cls) => toListItem(ctx, cls)));

		return {
			page,
			isDone: true,
			continueCursor: "",
		};
	}

	const result = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", args.programId))
		.order("asc")
		.paginate(args.paginationOpts);

	const page = await Promise.all(
		result.page.filter(isLive).map((cls) => toListItem(ctx, cls)),
	);

	return {
		page,
		isDone: result.isDone,
		continueCursor: result.continueCursor,
	};
}

/** Returns up to 50 classes for a program (e.g. switcher dropdowns). */
export async function listForSwitcher(
	ctx: AppQueryCtx,
	args: { programId: Id<"programs"> },
): Promise<ClassListItem[]> {
	const classes = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", args.programId))
		.take(50);

	return Promise.all(classes.filter(isLive).map((cls) => toListItem(ctx, cls)));
}

/** Get class by id */
export async function getById(ctx: AppQueryCtx, id: Id<"classes">) {
	const cls = await ctx.db.get("classes", id);
	if (!cls || !isLive(cls)) return null;
	return cls;
}

/** Get class by id including deleting */
export async function getByIdIncludingDeleting(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"classes">,
) {
	return await ctx.db.get("classes", id);
}

/** Ensure class belongs to the given institution */
export async function ensureInInstitution(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"classes">,
	institutionId: string,
) {
	const cls = await getByIdIncludingDeleting(ctx, id);

	if (!cls || !isLive(cls)) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	const program = await Program.getById(ctx, cls.programId, institutionId);

	if (!program) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	return cls;
}

/** Patch class */
export async function patch(
	ctx: AppMutationCtx,
	id: Id<"classes">,
	body: Infer<typeof PatchBasicInfoSchema>,
	cls: Doc<"classes">,
) {
	const updates: Partial<Doc<"classes">> = {
		updatedAt: Date.now(),
	};

	if (body.description !== undefined) {
		updates.description = body.description.trim();
	}

	if (body.name !== undefined) {
		const { name } = await assertNameAndSlugAvailable(ctx, cls.programId, {
			name: body.name,
			slug: cls.slug,
			excludeId: id,
		});
		updates.name = name;
	}

	return await ctx.db.patch("classes", id, updates);
}

/** Mark class as deleting */
export async function markDeleting(ctx: AppMutationCtx, id: Id<"classes">) {
	await ctx.db.patch("classes", id, {
		isDeleting: true,
		updatedAt: Date.now(),
	});
}

/** Delete attendance register tree */
export async function deleteAttendanceRegisterTree(
	ctx: AppMutationCtx,
	registerId: Id<"attendanceRegisters">,
): Promise<boolean> {
	const records = await ctx.db
		.query("attendanceRecords")
		.withIndex("by_register_and_sessionDate", (q) =>
			q.eq("registerId", registerId),
		)
		.take(DELETE_BATCH_SIZE);

	if (records.length === 0) return false;

	for (const record of records) {
		const entries = await ctx.db
			.query("attendanceEntries")
			.withIndex("by_record", (q) => q.eq("recordId", record._id))
			.take(DELETE_BATCH_SIZE);

		if (entries.length > 0) {
			for (const entry of entries) {
				await ctx.db.delete("attendanceEntries", entry._id);
			}
			return true;
		}

		const logs = await ctx.db
			.query("attendanceActivityLogs")
			.withIndex("by_record", (q) => q.eq("recordId", record._id))
			.take(DELETE_BATCH_SIZE);

		if (logs.length > 0) {
			for (const log of logs) {
				await ctx.db.delete("attendanceActivityLogs", log._id);
			}
			return true;
		}

		await ctx.db.delete("attendanceRecords", record._id);
	}

	return true;
}

async function deleteAttendanceForClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<boolean> {
	const registers = await ctx.db
		.query("attendanceRegisters")
		.withIndex("by_class_and_status", (q) => q.eq("classId", classId))
		.take(DELETE_BATCH_SIZE);

	if (registers.length === 0) return false;

	for (const register of registers) {
		const hasMoreRecords = await deleteAttendanceRegisterTree(
			ctx,
			register._id,
		);
		if (hasMoreRecords) return true;
		await ctx.db.delete("attendanceRegisters", register._id);
	}
	return true;
}

async function deleteTimetablesForClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<boolean> {
	const timetables = await ctx.db
		.query("timetable")
		.withIndex("by_class_and_version", (q) => q.eq("classId", classId))
		.take(DELETE_BATCH_SIZE);

	if (timetables.length === 0) return false;

	for (const timetable of timetables) {
		const slots = await ctx.db
			.query("timetableSlots")
			.withIndex("by_timetable", (q) => q.eq("timetableId", timetable._id))
			.take(DELETE_BATCH_SIZE);

		if (slots.length > 0) {
			for (const slot of slots) {
				await ctx.db.delete("timetableSlots", slot._id);
			}
			return true;
		}

		await ctx.db.delete("timetable", timetable._id);
	}

	return true;
}

async function deleteStudentsForClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<boolean> {
	const students = await ctx.db
		.query("students")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.take(DELETE_BATCH_SIZE);

	if (students.length === 0) return false;

	for (const student of students) {
		await ctx.db.delete("students", student._id);
	}
	return true;
}

async function deleteBatchesForClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<boolean> {
	const batches = await ctx.db
		.query("classBatches")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.take(DELETE_BATCH_SIZE);

	if (batches.length === 0) return false;

	for (const batch of batches) {
		await ctx.db.delete("classBatches", batch._id);
	}
	return true;
}

/**
 * Deletes class-related data in bounded batches.
 * Returns `true` when more work remains (caller should reschedule).
 */
export async function deleteCascadeBatch(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<boolean> {
	const cls = await getByIdIncludingDeleting(ctx, classId);
	if (!cls) return false;

	if (await deleteAttendanceForClass(ctx, cls._id)) return true;
	if (await deleteTimetablesForClass(ctx, cls._id)) return true;
	if (await deleteStudentsForClass(ctx, cls._id)) return true;
	if (await deleteBatchesForClass(ctx, cls._id)) return true;

	await ctx.db.delete("classes", cls._id);
	return false;
}
