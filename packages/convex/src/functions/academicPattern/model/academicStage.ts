import type { Doc, Id } from "../../_generated/dataModel";
import { buildStagesForPattern } from "../../helpers/academicPatternTemplates";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import type {
	AcademicStageDto,
	PatchCore,
	PatchMetadata,
} from "../validator/academicStage";

export type { AcademicStageDto } from "../validator/academicStage";
export {
	AcademicStageDtoSchema,
	PatchCoreSchema,
	PatchMetadataSchema,
} from "../validator/academicStage";

/** Maps a stage document to its API DTO. */
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

/** Lists stages for a pattern ordered by sequence number. */
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

/**
 * Loads a stage by id.
 * When `academicPatternId` is provided, returns null if the stage belongs to another pattern.
 */
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

/** Inserts a stage for a pattern using the default document shape. */
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

/** Updates editable stage metadata such as name and alias. */
export async function patchMetadata(
	ctx: AppMutationCtx,
	id: Id<"academicStages">,
	body: PatchMetadata,
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

/**
 * Adds, removes, or updates stages after a pattern's core fields change.
 * Preserves custom labels when only duration changes; resets labels when system type changes.
 */
export async function resyncForPatternCoreChange(
	ctx: AppMutationCtx,
	args: {
		academicPatternId: Id<"academicPatterns">;
		systemType: "semester" | "annual";
		durationInYears: number;
		resetLabels: boolean;
	},
) {
	const expectedStages = buildStagesForPattern(
		args.systemType,
		args.durationInYears,
	);
	const existingStages = await listByPattern(ctx, args.academicPatternId);
	const existingBySequence = new Map(
		existingStages.map((stage) => [stage.sequenceNumber, stage]),
	);
	const expectedSequences = new Set(
		expectedStages.map((stage) => stage.sequenceNumber),
	);

	for (const stage of existingStages) {
		if (!expectedSequences.has(stage.sequenceNumber)) {
			await ctx.db.delete("academicStages", stage._id);
		}
	}

	for (const template of expectedStages) {
		const existing = existingBySequence.get(template.sequenceNumber);

		if (existing) {
			const updates: Partial<Doc<"academicStages">> = {
				updatedAt: Date.now(),
			};

			if (existing.yearNumber !== template.yearNumber) {
				updates.yearNumber = template.yearNumber;
			}

			if (args.resetLabels) {
				if (existing.name !== template.name) updates.name = template.name;
				if (existing.alias !== template.alias)
					updates.alias = template.alias.trim();
			}

			if (Object.keys(updates).length > 1) {
				await ctx.db.patch("academicStages", existing._id, updates);
			}

			continue;
		}

		await insertForPattern(ctx, {
			academicPatternId: args.academicPatternId,
			name: template.name,
			alias: template.alias,
			sequenceNumber: template.sequenceNumber,
			yearNumber: template.yearNumber,
		});
	}
}

/** Updates structural stage fields when the parent pattern is editable. */
export async function patchCore(
	ctx: AppMutationCtx,
	id: Id<"academicStages">,
	body: PatchCore,
) {
	const stage = await ctx.db.get("academicStages", id);

	if (!stage) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
	}

	const pattern = await ctx.db.get("academicPatterns", stage.academicPatternId);

	if (!pattern) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
	}

	if (!pattern.canBeEdited) {
		throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_EDITABLE);
	}

	const updates: Partial<Doc<"academicStages">> = { updatedAt: Date.now() };

	if (body.sequenceNumber !== undefined)
		updates.sequenceNumber = body.sequenceNumber;
	if (body.yearNumber !== undefined) updates.yearNumber = body.yearNumber;

	await ctx.db.patch("academicStages", id, updates);
}
