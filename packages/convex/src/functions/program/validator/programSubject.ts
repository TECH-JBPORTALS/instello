import type { Infer } from "convex/values";
import { vv } from "#schema";

export const ALLOCATION_TYPES = ["theory", "practical"] as const;

export type AllocationType = (typeof ALLOCATION_TYPES)[number];

const allocationTypeValidator = vv.union(
	vv.literal("theory"),
	vv.literal("practical"),
);

export const AllocateInputSchema = {
	programId: vv.id("programs"),
	academicStageId: vv.id("academicStages"),
	subjectIds: vv.array(vv.id("subjects")),
	type: allocationTypeValidator,
};

export const AllocatableSubjectSchema = vv.object({
	_id: vv.id("subjects"),
	name: vv.string(),
	code: vv.string(),
	color: vv.string(),
	remainingTypes: vv.array(allocationTypeValidator),
});

export const ProgramSubjectListItemSchema = vv.object({
	_id: vv.id("programSubjects"),
	type: allocationTypeValidator,
	createdAt: vv.number(),
	subject: vv.object({
		_id: vv.id("subjects"),
		name: vv.string(),
		code: vv.string(),
		color: vv.string(),
	}),
});

export type AllocatableSubject = Infer<typeof AllocatableSubjectSchema>;
export type ProgramSubjectListItem = Infer<typeof ProgramSubjectListItemSchema>;
