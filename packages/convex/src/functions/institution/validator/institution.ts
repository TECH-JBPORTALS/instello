import type { Infer } from "convex/values";
import { vv } from "../../schema";
import { AdoptedPatternSummarySchema } from "./institutionAcademicPattern";

export const InstitutionDtoSchema = vv.object({
	_id: vv.string(),
	name: vv.string(),
	slug: vv.string(),
	logo: vv.optional(vv.union(vv.string(), vv.null())),
	code: vv.string(),
	addressLine: vv.string(),
	district: vv.string(),
	state: vv.string(),
	country: vv.string(),
	zipCode: vv.string(),
	createdAt: vv.number(),
	adoptedPattern: vv.nullable(AdoptedPatternSummarySchema),
});

export const InstitutionPatchSchema = vv.object({
	name: vv.optional(vv.string()),
	addressLine: vv.optional(vv.string()),
	district: vv.optional(vv.string()),
	state: vv.optional(vv.string()),
	country: vv.optional(vv.string()),
	zipCode: vv.optional(vv.string()),
});

export const InstitutionListItemSchema = vv.object({
	_id: vv.string(),
	name: vv.string(),
	slug: vv.string(),
	logo: vv.optional(vv.union(vv.string(), vv.null())),
	code: vv.string(),
	addressLine: vv.string(),
	district: vv.string(),
	state: vv.string(),
	country: vv.string(),
	zipCode: vv.string(),
	createdAt: vv.number(),
	adoptedPattern: vv.nullable(AdoptedPatternSummarySchema),
});

export type InstitutionDto = Infer<typeof InstitutionDtoSchema>;
export type InstitutionPatch = Infer<typeof InstitutionPatchSchema>;
export type InstitutionListItem = Infer<typeof InstitutionListItemSchema>;
