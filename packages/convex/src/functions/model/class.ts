import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import * as AcademicStage from "./academicStage";
import * as InstitutionAcademicPattern from "./institutionAcademicPattern";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const ClassStageSummarySchema = vv.object({
	_id: vv.id("academicStages"),
	name: vv.string(),
	alias: vv.string(),
	sequenceNumber: vv.number(),
});

export const CreateBodySchema = vv.object({
	name: vv.string(),
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
	description: vv.optional(vv.string()),
	status: vv.union(vv.literal("inactive"), vv.literal("active")),
	currentHeadStage: ClassStageSummarySchema,
});

export const ClassDtoSchema = vv.object({
	_id: vv.id("classes"),
	name: vv.string(),
	description: vv.optional(vv.string()),
	isGroupsEnabled: vv.boolean(),
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
		description: cls.description,
		isGroupsEnabled: cls.isGroupsEnabled,
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

export async function create(
	ctx: AppMutationCtx,
	args: {
		programId: Id<"programs">;
		body: Infer<typeof CreateBodySchema>;
	},
) {
	const now = Date.now();

	return await ctx.db.insert("classes", {
		programId: args.programId,
		name: args.body.name.trim(),
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
		const page = await Promise.all(
			filtered.map((cls) => toListItem(ctx, cls)),
		);

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

export async function patch(
	ctx: AppMutationCtx,
	id: Id<"classes">,
	body: Infer<typeof PatchBasicInfoSchema>,
) {
	return await ctx.db.patch("classes", id, {
		...body,
		updatedAt: Date.now(),
	});
}
