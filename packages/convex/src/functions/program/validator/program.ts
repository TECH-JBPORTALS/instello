import type { Infer } from "convex/values";
import { vv } from "@/schema";

export const CreateInputSchema = {
	name: vv.string(),
	alias: vv.string(),
};

export const PatchNameSchema = vv.object({
	name: vv.string(),
});

export const PatchAliasSchema = vv.object({
	alias: vv.string(),
});

export const ProgramDtoSchema = vv.object({
	_id: vv.id("programs"),
	name: vv.string(),
	alias: vv.string(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
	createdAt: vv.number(),
});

export const ProgramListItemSchema = vv.object({
	_id: vv.id("programs"),
	name: vv.string(),
	alias: vv.string(),
	createdAt: vv.number(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
	user: vv.object({
		_id: vv.string(),
		name: vv.string(),
		email: vv.string(),
		image: vv.nullable(vv.string()),
	}),
});

export type ProgramDto = Infer<typeof ProgramDtoSchema>;
export type ProgramListItem = Infer<typeof ProgramListItemSchema>;
