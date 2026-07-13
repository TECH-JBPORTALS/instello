import type { Doc, Id } from "../../_generated/dataModel";
import { DEFAULT_PATTERN_TEMPLATES } from "../../helpers/academicPatternTemplates";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import type {
	AcademicPatternDetailDto,
	AcademicPatternDto,
	PatchCore,
	PatchMetadata,
} from "../validator/academicPattern";
import * as AcademicStage from "./academicStage";

export type {
	AcademicPatternDetailDto,
	AcademicPatternDto,
} from "../validator/academicPattern";
export {
	AcademicPatternDetailDtoSchema,
	AcademicPatternDtoSchema,
	CreateInputSchema,
	PatchCoreSchema,
	PatchMetadataSchema,
} from "../validator/academicPattern";

/** Maps a pattern document to the list DTO, including a precomputed stage count. */
export function toDto(
	pattern: Doc<"academicPatterns">,
	stageCount: number,
): AcademicPatternDto {
	return {
		_id: pattern._id,
		name: pattern.name,
		description: pattern.description,
		systemType: pattern.systemType,
		durationInYears: pattern.durationInYears,
		templateKey: pattern.templateKey,
		canBeEdited: pattern.canBeEdited,
		stageCount,
		createdAt: pattern.createdAt,
	};
}

/** Maps a pattern document to the detail DTO, loading ordered stages from the database. */
export async function toDetailDto(
	ctx: AppQueryCtx,
	pattern: Doc<"academicPatterns">,
): Promise<AcademicPatternDetailDto> {
	const stages = await AcademicStage.listByPattern(ctx, pattern._id);

	return {
		_id: pattern._id,
		name: pattern.name,
		description: pattern.description,
		systemType: pattern.systemType,
		durationInYears: pattern.durationInYears,
		templateKey: pattern.templateKey,
		canBeEdited: pattern.canBeEdited,
		createdAt: pattern.createdAt,
		stages: stages.map(AcademicStage.toDto),
	};
}

/** Lists all patterns for an owner organization with stage counts. */
export async function listByOwnerOrg(
	ctx: AppQueryCtx,
	ownerOrganizationId: Id<"ownerOrganizations">,
): Promise<AcademicPatternDto[]> {
	const patterns = await ctx.db
		.query("academicPatterns")
		.withIndex("by_ownerOrganization", (q) =>
			q.eq("ownerOrganizationId", ownerOrganizationId),
		)
		.take(50);

	return await Promise.all(
		patterns.map(async (pattern) => {
			const stages = await AcademicStage.listByPattern(ctx, pattern._id);
			return toDto(pattern, stages.length);
		}),
	);
}

/**
 * Loads a pattern by id.
 * When `ownerOrganizationId` is provided, returns null if the pattern belongs to another org.
 */
export async function getById(
	ctx: AppQueryCtx,
	id: Id<"academicPatterns">,
	ownerOrganizationId?: Id<"ownerOrganizations">,
) {
	const pattern = await ctx.db.get("academicPatterns", id);

	if (!pattern) return null;
	if (
		ownerOrganizationId &&
		pattern.ownerOrganizationId !== ownerOrganizationId
	) {
		return null;
	}

	return pattern;
}

/** Creates a pattern and inserts its initial stages. */
export async function create(
	ctx: AppMutationCtx,
	args: {
		ownerOrganizationId: Id<"ownerOrganizations">;
		name: string;
		description?: string;
		systemType: "semester" | "annual";
		durationInYears: number;
		templateKey?: "engineering" | "diploma";
		stages: Array<{
			name: string;
			alias: string;
			sequenceNumber: number;
			yearNumber: number;
		}>;
	},
) {
	const now = Date.now();
	const patternId = await ctx.db.insert("academicPatterns", {
		ownerOrganizationId: args.ownerOrganizationId,
		name: args.name,
		description: args.description,
		systemType: args.systemType,
		durationInYears: args.durationInYears,
		templateKey: args.templateKey,
		canBeEdited: true,
		createdAt: now,
		updatedAt: now,
	});

	for (const stage of args.stages) {
		await AcademicStage.insertForPattern(ctx, {
			academicPatternId: patternId,
			name: stage.name,
			alias: stage.alias.trim(),
			sequenceNumber: stage.sequenceNumber,
			yearNumber: stage.yearNumber,
		});
	}

	return patternId;
}

/** Updates editable pattern metadata such as name and description. */
export async function patchMetadata(
	ctx: AppMutationCtx,
	id: Id<"academicPatterns">,
	body: PatchMetadata,
) {
	const pattern = await ctx.db.get("academicPatterns", id);

	if (!pattern) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
	}

	const updates: Partial<Doc<"academicPatterns">> = { updatedAt: Date.now() };

	if (body.name !== undefined) updates.name = body.name;
	if (body.description !== undefined) updates.description = body.description;

	await ctx.db.patch("academicPatterns", id, updates);
}

/**
 * Updates core pattern fields when the pattern is editable.
 * Resyncs stages when system type or duration changes.
 */
export async function patchCore(
	ctx: AppMutationCtx,
	id: Id<"academicPatterns">,
	body: PatchCore,
) {
	const pattern = await ctx.db.get("academicPatterns", id);

	if (!pattern) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
	}

	if (!pattern.canBeEdited) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_EDITABLE);
	}

	const nextSystemType = body.systemType ?? pattern.systemType;
	const nextDurationInYears = body.durationInYears ?? pattern.durationInYears;
	const systemTypeChanged =
		body.systemType !== undefined && body.systemType !== pattern.systemType;
	const durationChanged =
		body.durationInYears !== undefined &&
		body.durationInYears !== pattern.durationInYears;

	const updates: Partial<Doc<"academicPatterns">> = { updatedAt: Date.now() };

	if (body.systemType !== undefined) updates.systemType = body.systemType;
	if (body.durationInYears !== undefined)
		updates.durationInYears = body.durationInYears;

	await ctx.db.patch("academicPatterns", id, updates);

	if (systemTypeChanged || durationChanged) {
		await AcademicStage.resyncForPatternCoreChange(ctx, {
			academicPatternId: id,
			systemType: nextSystemType,
			durationInYears: nextDurationInYears,
			resetLabels: systemTypeChanged,
		});
	}
}

/** Locks core pattern fields after an institution adopts the pattern. */
export async function lock(ctx: AppMutationCtx, id: Id<"academicPatterns">) {
	const pattern = await ctx.db.get("academicPatterns", id);

	if (!pattern) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
	}

	await ctx.db.patch("academicPatterns", id, {
		canBeEdited: false,
		updatedAt: Date.now(),
	});
}

/** Unlocks a pattern when it is no longer adopted by any institution. */
export async function unlockIfUnused(
	ctx: AppMutationCtx,
	id: Id<"academicPatterns">,
) {
	const adoption = await ctx.db
		.query("institutionAcademicPatterns")
		.withIndex("by_academicPattern", (q) => q.eq("academicPatternId", id))
		.first();

	if (adoption) return;

	const pattern = await ctx.db.get("academicPatterns", id);

	if (!pattern) return;

	await ctx.db.patch("academicPatterns", id, {
		canBeEdited: true,
		updatedAt: Date.now(),
	});
}

/* SEEDING FUNCTIONS */

/** Seeds the default engineering and diploma templates for a new owner organization. */
export async function seedDefaults(
	ctx: AppMutationCtx,
	ownerOrganizationId: Id<"ownerOrganizations">,
) {
	for (const template of DEFAULT_PATTERN_TEMPLATES) {
		const existing = await ctx.db
			.query("academicPatterns")
			.withIndex("by_ownerOrganization_and_templateKey", (q) =>
				q
					.eq("ownerOrganizationId", ownerOrganizationId)
					.eq("templateKey", template.templateKey),
			)
			.first();

		if (existing) continue;

		await create(ctx, {
			ownerOrganizationId,
			name: template.name,
			description: template.description,
			systemType: template.systemType,
			durationInYears: template.durationInYears,
			templateKey: template.templateKey,
			stages: template.stages,
		});
	}
}

/** Backfills default stage names and aliases for editable seeded patterns. */
export async function normalizeTemplateStages(
	ctx: AppMutationCtx,
	ownerOrganizationId: Id<"ownerOrganizations">,
) {
	for (const template of DEFAULT_PATTERN_TEMPLATES) {
		const pattern = await ctx.db
			.query("academicPatterns")
			.withIndex("by_ownerOrganization_and_templateKey", (q) =>
				q
					.eq("ownerOrganizationId", ownerOrganizationId)
					.eq("templateKey", template.templateKey),
			)
			.first();

		if (!pattern?.canBeEdited || !pattern.templateKey) continue;

		const stages = await AcademicStage.listByPattern(ctx, pattern._id);

		for (const stageTemplate of template.stages) {
			const stage = stages.find(
				(entry) => entry.sequenceNumber === stageTemplate.sequenceNumber,
			);

			if (!stage) continue;

			if (
				stage.name === stageTemplate.name &&
				stage.alias === stageTemplate.alias
			) {
				continue;
			}

			await ctx.db.patch("academicStages", stage._id, {
				name: stageTemplate.name,
				alias: stageTemplate.alias,
				updatedAt: Date.now(),
			});
		}
	}
}
