import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import * as AcademicStage from "../academicPattern/model/academicStage";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insMutation } from "../helpers/customFunctions";
import * as InstitutionAcademicPattern from "../institution/model/institutionAcademicPattern";
import { vv } from "../schema";
import * as Program from "./model/program";
import * as ProgramSubject from "./model/programSubject";
import {
	CreateInputSchema,
	PatchAliasSchema,
	PatchNameSchema,
} from "./validator/program";
import { AllocateInputSchema } from "./validator/programSubject";

/** Creates program in the current institution
 * @returns program id
 */
export const create = insMutation({
	permissions: ["program:create"],
	args: CreateInputSchema,
	returns: vv.id("programs"),
	handler: async (ctx, args) => {
		return await Program.create(ctx, {
			...args,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
		});
	},
});

/** Update program name
 * @param id - program id to be updated
 * @param body - program name mentioned in the body
 */
export const updateName = insMutation({
	permissions: ["program:update"],
	args: {
		id: vv.id("programs"),
		body: PatchNameSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id, ctx.institution._id);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		await Program.patch(ctx, args.id, args.body);
		return null;
	},
});

/** Update program alias
 * @param id - program id to be updated
 * @param body - program alias mentioned in the body
 */
export const updateAlias = insMutation({
	permissions: ["program:update"],
	args: {
		id: vv.id("programs"),
		body: PatchAliasSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id, ctx.institution._id);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		await Program.patch(ctx, args.id, args.body);
		return null;
	},
});

/** Soft-mark program for deletion and schedule cascade cleanup */
export const remove = insMutation({
	permissions: ["program:delete"],
	args: {
		id: vv.id("programs"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id, ctx.institution._id);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		await Program.markDeleting(ctx, args.id);
		await ctx.scheduler.runAfter(0, internal.program.mutations.deleteCascade, {
			programId: args.id,
		});
		return null;
	},
});

/** Allocates subjects to a program's academic stage with a given type (theory/practical)
 * @returns ids of the newly created allocations (already-allocated subjects are skipped)
 */
export const allocateSubjects = insMutation({
	permissions: ["program:update"],
	args: AllocateInputSchema,
	returns: vv.array(vv.id("programSubjects")),
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		const adoption = await InstitutionAcademicPattern.getByInstitution(
			ctx,
			ctx.institution._id,
		);

		if (!adoption) {
			throwAppError(ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.NOT_FOUND);
		}

		const stage = await AcademicStage.getById(
			ctx,
			args.academicStageId,
			adoption.academicPatternId,
		);

		if (!stage) {
			throwAppError(ERROR_CODES.PROGRAM_SUBJECT.INVALID_STAGE);
		}

		return await ProgramSubject.allocateMany(ctx, args);
	},
});

/** Removes a subject allocation from a program's academic stage */
export const removeSubject = insMutation({
	permissions: ["program:update"],
	args: { id: vv.id("programSubjects") },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const programSubject = await ProgramSubject.getById(ctx, args.id);

		if (!programSubject) {
			throwAppError(ERROR_CODES.PROGRAM_SUBJECT.NOT_FOUND);
		}

		const program = await Program.getById(
			ctx,
			programSubject.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM_SUBJECT.NOT_FOUND);
		}

		await ProgramSubject.removeById(ctx, args.id);
		return null;
	},
});

/** Batched cascade deletion for a program marked with `isDeleting` */
export const deleteCascade = internalMutation({
	args: {
		programId: vv.id("programs"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const hasMore = await Program.deleteCascadeBatch(ctx, args.programId);
		if (hasMore) {
			await ctx.scheduler.runAfter(
				0,
				internal.program.mutations.deleteCascade,
				{
					programId: args.programId,
				},
			);
		}
		return null;
	},
});
