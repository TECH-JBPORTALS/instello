import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { slugifyName } from "../helpers/slug";
import { vv } from "../schema";
import * as AcademicStage from "./academicStage";
import { BatchNamingConventionSchema } from "./classBatch";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";
import * as InstitutionAcademicPattern from "./institutionAcademicPattern";
import * as Program from "./program";

export const ClassStageSummarySchema = vv.object({
	_id: vv.id("academicStages"),
	name: vv.string(),
	alias: vv.string(),
	sequenceNumber: vv.number(),
});

export const CreateBodySchema = vv.object({
	name: vv.string(),
	slug: vv.string(),
	description: vv.optional(vv.string()),
	currentHeadStageId: vv.id("academicStages"),
});

export const CreateInputSchema = {
	programId: vv.id("programs"),
	body: CreateBodySchema,
};

export const PatchBasicInfoSchema = vv.object({
	name: vv.optional(vv.string()),
	description: vv.optional(vv.string()),
});

export const ClassListItemSchema = vv.object({
	_id: vv.id("classes"),
	name: vv.string(),
	slug: vv.string(),
	description: vv.optional(vv.string()),
	status: vv.union(vv.literal("inactive"), vv.literal("active")),
	currentHeadStage: ClassStageSummarySchema,
});

export const ClassDtoSchema = vv.object({
	_id: vv.id("classes"),
	name: vv.string(),
	slug: vv.string(),
	description: vv.optional(vv.string()),
	isGroupsEnabled: vv.boolean(),
	batchNamingConvention: vv.optional(BatchNamingConventionSchema),
	status: vv.union(vv.literal("inactive"), vv.literal("active")),
	currentHeadStage: ClassStageSummarySchema,
	createdAt: vv.number(),
	updatedAt: vv.optional(vv.number()),
});

export const PaginatedClassListSchema = vv.object({
	page: vv.array(ClassListItemSchema),
	isDone: vv.boolean(),
	continueCursor: vv.string(),
});

export type ClassStageSummary = Infer<typeof ClassStageSummarySchema>;
export type ClassDto = Infer<typeof ClassDtoSchema>;
export type ClassListItem = Infer<typeof ClassListItemSchema>;
export type PaginatedClassList = Infer<typeof PaginatedClassListSchema>;

function toStageSummary(stage: Doc<"academicStages">): ClassStageSummary {
	return {
		_id: stage._id,
		name: stage.name,
		alias: stage.alias,
		sequenceNumber: stage.sequenceNumber,
	};
}

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

export async function findBySlug(
	ctx: AppQueryCtx | AppMutationCtx,
	programId: Id<"programs">,
	slug: string,
) {
	return await ctx.db
		.query("classes")
		.withIndex("by_program_and_slug", (q) =>
			q.eq("programId", programId).eq("slug", slug),
		)
		.unique();
}

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
			(cls) => cls.name.trim().toLowerCase() === trimmedName.toLowerCase(),
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

export function normalizeClassSlugForCheck(slug: string): string {
	return slugifyName(slug);
}

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

		const filtered = result.page.filter((cls) =>
			cls.name.toLowerCase().includes(normalizedQuery),
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
		result.page.map((cls) => toListItem(ctx, cls)),
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

	return Promise.all(classes.map((cls) => toListItem(ctx, cls)));
}

export async function getById(ctx: AppQueryCtx, id: Id<"classes">) {
	return await ctx.db.get("classes", id);
}

/** Fetches a class and verifies it belongs to the given institution (via its program). */
export async function ensureInInstitution(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"classes">,
	institutionId: string,
) {
	const cls = await getById(ctx, id);

	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	const program = await Program.getById(
		ctx,
		cls.programId as Id<"programs">,
		institutionId,
	);

	if (!program) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	return cls;
}

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
		const { name } = await assertNameAndSlugAvailable(
			ctx,
			cls.programId as Id<"programs">,
			{ name: body.name, slug: cls.slug, excludeId: id },
		);
		updates.name = name;
	}

	return await ctx.db.patch("classes", id, updates);
}
