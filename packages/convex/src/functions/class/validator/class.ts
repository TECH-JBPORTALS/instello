import type { Infer } from "convex/values";
import { vv } from "../../schema";
import { BatchNamingConventionSchema } from "./classBatch";

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
