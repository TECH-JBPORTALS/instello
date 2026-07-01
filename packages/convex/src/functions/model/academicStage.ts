import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const PatchMetadataSchema = vv.object({
	name: vv.optional(vv.string()),
	alias: vv.optional(vv.string()),
});

export const PatchCoreSchema = vv.object({
	sequenceNumber: vv.optional(vv.number()),
	yearNumber: vv.optional(vv.number()),
});

export const AcademicStageDtoSchema = vv.object({
	_id: vv.id("academicStages"),
	name: vv.string(),
	alias: vv.string(),
	academicPatternId: vv.id("academicPatterns"),
	sequenceNumber: vv.number(),
	yearNumber: vv.number(),
	createdAt: vv.number(),
});

export type AcademicStageDto = Infer<typeof AcademicStageDtoSchema>;

export function toDto(stage: Doc<"academicStages">): AcademicStageDto {
	return {
		_id: stage._id,
		name: stage.name,
		alias: stage.alias,
		academicPatternId: stage.academicPatternId,
		sequenceNumber: stage.sequenceNumber,
		yearNumber: stage.yearNumber,
		createdAt: stage.createdAt,
	};
}

export async function listByPattern(
	ctx: AppQueryCtx,
	academicPatternId: Id<"academicPatterns">,
) {
	return await ctx.db
		.query("academicStages")
		.withIndex("by_academicPattern_and_sequence", (q) =>
			q.eq("academicPatternId", academicPatternId),
		)
		.order("asc")
		.take(50);
}

export async function getById(
	ctx: AppQueryCtx,
	id: Id<"academicStages">,
	academicPatternId?: Id<"academicPatterns">,
) {
	const stage = await ctx.db.get("academicStages", id);

	if (!stage) return null;
	if (academicPatternId && stage.academicPatternId !== academicPatternId) {
		return null;
	}

	return stage;
}

export async function insertForPattern(
	ctx: AppMutationCtx,
	args: {
		academicPatternId: Id<"academicPatterns">;
		name: string;
		alias: string;
		sequenceNumber: number;
		yearNumber: number;
	},
) {
	const now = Date.now();

	return await ctx.db.insert("academicStages", {
		academicPatternId: args.academicPatternId,
		name: args.name,
		alias: args.alias.trim(),
		sequenceNumber: args.sequenceNumber,
		yearNumber: args.yearNumber,
		createdAt: now,
		updatedAt: now,
	});
}

export async function patchMetadata(
	ctx: AppMutationCtx,
	id: Id<"academicStages">,
	body: Infer<typeof PatchMetadataSchema>,
) {
	const stage = await ctx.db.get("academicStages", id);

	if (!stage) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
	}

	const updates: Partial<Doc<"academicStages">> = { updatedAt: Date.now() };

	if (body.name !== undefined) updates.name = body.name;
	if (body.alias !== undefined) updates.alias = body.alias.trim();

	await ctx.db.patch("academicStages", id, updates);
}

async function ensurePatternEditable(
	ctx: AppMutationCtx,
	academicPatternId: Id<"academicPatterns">,
) {
	const pattern = await ctx.db.get("academicPatterns", academicPatternId);

	if (!pattern) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
	}

	if (!pattern.canBeEdited) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_EDITABLE);
	}

	return pattern;
}

export async function patchCore(
	ctx: AppMutationCtx,
	id: Id<"academicStages">,
	body: Infer<typeof PatchCoreSchema>,
) {
	const stage = await ctx.db.get("academicStages", id);

	if (!stage) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
	}

	await ensurePatternEditable(ctx, stage.academicPatternId);

	const updates: Partial<Doc<"academicStages">> = { updatedAt: Date.now() };

	if (body.sequenceNumber !== undefined)
		updates.sequenceNumber = body.sequenceNumber;
	if (body.yearNumber !== undefined) updates.yearNumber = body.yearNumber;

	await ctx.db.patch("academicStages", id, updates);
}
