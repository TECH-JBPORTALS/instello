import type { Infer } from "convex/values";
import { vv } from "#schema";

/** Slim faculty summary shown on class subject list rows */
export const ClassSubjectFacultySummarySchema = vv.object({
	_id: vv.id("faculty"),
	firstName: vv.string(),
	lastName: vv.string(),
	image: vv.optional(vv.string()),
});

export type ClassSubjectFacultySummary = Infer<
	typeof ClassSubjectFacultySummarySchema
>;

const allocationTypeValidator = vv.union(
	vv.literal("theory"),
	vv.literal("practical"),
);

/** Subject allocated to the class's current stage, with assigned faculty */
export const ClassSubjectListItemSchema = vv.object({
	_id: vv.id("programSubjects"),
	type: allocationTypeValidator,
	createdAt: vv.number(),
	subject: vv.object({
		_id: vv.id("subjects"),
		name: vv.string(),
		code: vv.string(),
		color: vv.string(),
		alias: vv.string(),
	}),
	faculty: vv.array(ClassSubjectFacultySummarySchema),
});

export type ClassSubjectListItem = Infer<typeof ClassSubjectListItemSchema>;

/** One subject assignment under a class for the current faculty member */
export const MyAssignedSubjectSchema = vv.object({
	programSubjectId: vv.id("programSubjects"),
	name: vv.string(),
	alias: vv.string(),
	code: vv.string(),
	color: vv.string(),
	type: allocationTypeValidator,
});

/** Class group of subjects assigned to the current faculty member */
export const MyAssignedClassSubjectsSchema = vv.object({
	classId: vv.id("classes"),
	className: vv.string(),
	classSlug: vv.string(),
	programAlias: vv.string(),
	programName: vv.string(),
	subjects: vv.array(MyAssignedSubjectSchema),
});

export type MyAssignedClassSubjects = Infer<
	typeof MyAssignedClassSubjectsSchema
>;
