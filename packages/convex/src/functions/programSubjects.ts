import * as AcademicStage from "./academicPattern/model/academicStage";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as InstitutionAcademicPattern from "./institution/model/institutionAcademicPattern";
import * as Program from "./model/program";
import * as ProgramSubject from "./model/programSubject";
import { vv } from "./schema";

/** Lists subjects allocated to a program for a given academic stage.
 * @returns allocated subjects with their type, joined with subject catalog details
 */
export const listByStage = insQuery({
	permissions: ["program:view"],
	args: {
		programId: vv.id("programs"),
		academicStageId: vv.id("academicStages"),
	},
	returns: vv.array(ProgramSubject.ProgramSubjectListItemSchema),
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return await ProgramSubject.listByStage(ctx, {
			programId: args.programId,
			academicStageId: args.academicStageId,
		});
	},
});

/** Lists institution subjects that can still be allocated to a program's academic stage
 * @returns subjects not yet allocated to that program + stage
 */
export const listAllocatable = insQuery({
	permissions: ["program:update"],
	args: {
		programId: vv.id("programs"),
		academicStageId: vv.id("academicStages"),
	},
	returns: vv.array(ProgramSubject.AllocatableSubjectSchema),
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

		return await ProgramSubject.listAllocatable(ctx, {
			institutionId: ctx.institution._id,
			programId: args.programId,
			academicStageId: args.academicStageId,
		});
	},
});

/** Allocates subjects to a program's academic stage with a given type (theory/practical)
 * @returns ids of the newly created allocations (already-allocated subjects are skipped)
 */
export const allocate = insMutation({
	permissions: ["program:update"],
	args: ProgramSubject.AllocateInputSchema,
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
export const remove = insMutation({
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
