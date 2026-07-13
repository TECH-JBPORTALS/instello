import * as AcademicStage from "../academicPattern/model/academicStage";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import * as InstitutionAcademicPattern from "../institution/model/institutionAcademicPattern";
import { vv } from "../schema";
import * as Program from "./model/program";
import * as ProgramSubject from "./model/programSubject";
import { ProgramDtoSchema, ProgramListItemSchema } from "./validator/program";
import {
	AllocatableSubjectSchema,
	ProgramSubjectListItemSchema,
} from "./validator/programSubject";

/** Check if a program alias is available in the current institution */
export const checkAlias = insQuery({
	permissions: ["program:create"],
	args: { alias: vv.string() },
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const alias = args.alias.trim();
		if (!alias) return { available: false };

		const existing = await Program.findByAliasIncludingDeleting(
			ctx,
			ctx.institution._id,
			alias,
		);

		return { available: existing === null };
	},
});

/** Lists program in the current institution
 * @returns programs
 */
export const list = insQuery({
	permissions: ["program:view"],
	args: {
		query: vv.optional(vv.nullable(vv.string())),
	},
	returns: vv.array(ProgramListItemSchema),
	handler: async (ctx, args) => {
		return await Program.list(ctx, {
			institutionId: ctx.institution._id,
			query: args.query,
		});
	},
});

/** Get the program by alias in the current institution
 * @param alias - program alias
 * @returns program
 */
export const getByAlias = insQuery({
	permissions: ["program:view"],
	args: { alias: vv.string() },
	returns: ProgramDtoSchema,
	handler: async (ctx, args) => {
		const alias = args.alias.trim();
		const program = await Program.findByAlias(ctx, ctx.institution._id, alias);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return Program.toDto(program);
	},
});

/** Get the program by id
 * @param id - program id
 * @returns program
 */
export const getById = insQuery({
	permissions: ["program:view"],
	args: { id: vv.id("programs") },
	returns: ProgramDtoSchema,
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id, ctx.institution._id);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return Program.toDto(program);
	},
});

/** Lists subjects allocated to a program for a given academic stage.
 * @returns allocated subjects with their type, joined with subject catalog details
 */
export const listSubjectsByStage = insQuery({
	permissions: ["program:view"],
	args: {
		programId: vv.id("programs"),
		academicStageId: vv.id("academicStages"),
	},
	returns: vv.array(ProgramSubjectListItemSchema),
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
export const listAllocatableSubjects = insQuery({
	permissions: ["program:update"],
	args: {
		programId: vv.id("programs"),
		academicStageId: vv.id("academicStages"),
	},
	returns: vv.array(AllocatableSubjectSchema),
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
