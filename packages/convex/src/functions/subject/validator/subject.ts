import type { Infer } from "convex/values";
import { vv } from "../../schema";

export const CreateInputSchema = {
	name: vv.string(),
	code: vv.string(),
	alias: vv.string(),
	color: vv.optional(vv.string()),
	description: vv.optional(vv.string()),
};

export const CreateInputObjectSchema = vv.object(CreateInputSchema);

export const PatchNameSchema = vv.object({
	name: vv.string(),
});

export const PatchCodeSchema = vv.object({
	code: vv.string(),
});

export const PatchAliasSchema = vv.object({
	alias: vv.string(),
});

export const PatchColorSchema = vv.object({
	color: vv.string(),
});

export const PatchDescriptionSchema = vv.object({
	description: vv.optional(vv.string()),
});

export const SubjectDtoSchema = vv.object({
	_id: vv.id("subjects"),
	name: vv.string(),
	code: vv.string(),
	alias: vv.string(),
	color: vv.string(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
	description: vv.optional(vv.string()),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export const SubjectListItemSchema = vv.object({
	_id: vv.id("subjects"),
	name: vv.string(),
	code: vv.string(),
	alias: vv.string(),
	color: vv.string(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
});

export const PaginatedSubjectListSchema = vv.object({
	page: vv.array(SubjectListItemSchema),
	isDone: vv.boolean(),
	continueCursor: vv.string(),
});

export type SubjectDto = Infer<typeof SubjectDtoSchema>;
export type SubjectListItem = Infer<typeof SubjectListItemSchema>;
export type PaginatedSubjectList = Infer<typeof PaginatedSubjectListSchema>;
export type CreateInput = Infer<typeof CreateInputObjectSchema>;
