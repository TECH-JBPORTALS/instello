import type { Infer } from "convex/values";
import { vv } from "#schema";
import { AcademicStageDtoSchema } from "./academicStage";

export const CreateInputSchema = {
	name: vv.string(),
	description: vv.optional(vv.string()),
	systemType: vv.union(vv.literal("semester"), vv.literal("annual")),
	durationInYears: vv.number(),
	stages: vv.array(
		vv.object({
			name: vv.string(),
			alias: vv.string(),
			sequenceNumber: vv.number(),
			yearNumber: vv.number(),
		}),
	),
};

export const PatchMetadataSchema = vv.object({
	name: vv.optional(vv.string()),
	description: vv.optional(vv.string()),
});

export const PatchCoreSchema = vv.object({
	systemType: vv.optional(
		vv.union(vv.literal("semester"), vv.literal("annual")),
	),
	durationInYears: vv.optional(vv.number()),
});

export const AcademicPatternDtoSchema = vv.object({
	_id: vv.id("academicPatterns"),
	name: vv.string(),
	description: vv.optional(vv.string()),
	systemType: vv.union(vv.literal("semester"), vv.literal("annual")),
	durationInYears: vv.number(),
	templateKey: vv.optional(
		vv.union(vv.literal("engineering"), vv.literal("diploma")),
	),
	canBeEdited: vv.boolean(),
	stageCount: vv.number(),
	createdAt: vv.number(),
});

export const AcademicPatternDetailDtoSchema = vv.object({
	_id: vv.id("academicPatterns"),
	name: vv.string(),
	description: vv.optional(vv.string()),
	systemType: vv.union(vv.literal("semester"), vv.literal("annual")),
	durationInYears: vv.number(),
	templateKey: vv.optional(
		vv.union(vv.literal("engineering"), vv.literal("diploma")),
	),
	canBeEdited: vv.boolean(),
	createdAt: vv.number(),
	stages: vv.array(AcademicStageDtoSchema),
});

export type AcademicPatternDto = Infer<typeof AcademicPatternDtoSchema>;
export type AcademicPatternDetailDto = Infer<
	typeof AcademicPatternDetailDtoSchema
>;
export type PatchMetadata = Infer<typeof PatchMetadataSchema>;
export type PatchCore = Infer<typeof PatchCoreSchema>;
