import type { Infer } from "convex/values";
import { vv } from "../../schema";

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
export type PatchMetadata = Infer<typeof PatchMetadataSchema>;
export type PatchCore = Infer<typeof PatchCoreSchema>;
