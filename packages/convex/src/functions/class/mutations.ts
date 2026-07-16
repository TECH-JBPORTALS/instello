import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insMutation } from "../helpers/customFunctions";
import * as Program from "../program/model/program";
import * as ProgramFaculty from "../program/model/programFaculty";
import * as ProgramSubject from "../program/model/programSubject";
import { vv } from "../schema";
import * as Student from "../student/model/student";
import * as Class from "./model/class";
import * as ClassBatch from "./model/classBatch";
import * as ClassSubjectFaculty from "./model/classSubjectFaculty";
import { CreateInputSchema, PatchBasicInfoSchema } from "./validator/class";
import {
	BatchDtoSchema,
	BatchNamingConventionSchema,
} from "./validator/classBatch";

/** Creates class in the program */
export const create = insMutation({
	permissions: ["class:create"],
	args: CreateInputSchema,
	returns: vv.id("classes"),
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		await Class.validateHeadStage(ctx, {
			institutionId: ctx.institution._id,
			stageId: args.body.currentHeadStageId,
		});

		return await Class.create(ctx, {
			programId: args.programId,
			body: args.body,
		});
	},
});

/** Update class name and description */
export const updateBasicInfo = insMutation({
	permissions: ["class:update"],
	args: {
		id: vv.id("classes"),
		body: PatchBasicInfoSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.id,
			ctx.institution._id,
		);

		await Class.patch(ctx, args.id, args.body, cls);
		return null;
	},
});

/** Enable batches for a class. Splits any existing students evenly across
 * two new batches, or leaves them empty if the class has no students yet.
 */
export const enableSectionGroups = insMutation({
	permissions: ["class:update"],
	args: {
		id: vv.id("classes"),
	},
	returns: vv.object({
		_id: vv.id("classes"),
		isGroupsEnabled: vv.boolean(),
	}),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.id,
			ctx.institution._id,
		);

		if (cls.isGroupsEnabled) {
			throwAppError(ERROR_CODES.CLASS.BATCHES_ALREADY_ENABLED);
		}

		await ClassBatch.enableForClass(ctx, cls);

		return { _id: cls._id, isGroupsEnabled: true };
	},
});

/** Disable batches for a class by id. Deletes all batches and batch
 * assignments; students remain in the class without a batch.
 */
export const disableSectionGroups = insMutation({
	permissions: ["class:update"],
	args: {
		id: vv.id("classes"),
	},
	returns: vv.object({
		_id: vv.id("classes"),
		isGroupsEnabled: vv.boolean(),
	}),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.id,
			ctx.institution._id,
		);

		if (!cls.isGroupsEnabled) {
			throwAppError(ERROR_CODES.CLASS.BATCHES_NOT_ENABLED);
		}

		await ClassBatch.disableForClass(ctx, cls._id);

		return { _id: cls._id, isGroupsEnabled: false };
	},
});

/** Soft-mark class for deletion and schedule cascade cleanup */
export const remove = insMutation({
	permissions: ["class:delete"],
	args: {
		id: vv.id("classes"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.id,
			ctx.institution._id,
		);

		await Class.markDeleting(ctx, cls._id);
		await ctx.scheduler.runAfter(0, internal.class.mutations.deleteCascade, {
			classId: cls._id,
		});
		return null;
	},
});

/** Updates how batch labels are displayed for a class. */
export const updateBatchNamingConvention = insMutation({
	permissions: ["class:update"],
	args: {
		classId: vv.id("classes"),
		namingConvention: BatchNamingConventionSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		if (!cls.isGroupsEnabled) {
			throwAppError(ERROR_CODES.CLASS.BATCHES_NOT_ENABLED);
		}

		await ClassBatch.updateNamingConvention(
			ctx,
			cls._id,
			args.namingConvention,
		);
		return null;
	},
});

/** Creates the next batch in a class and moves the given students into it. */
export const splitIntoNewBatch = insMutation({
	permissions: ["student:update"],
	args: {
		classId: vv.id("classes"),
		studentIds: vv.array(vv.id("students")),
	},
	returns: BatchDtoSchema,
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		if (!cls.isGroupsEnabled) {
			throwAppError(ERROR_CODES.CLASS.BATCHES_NOT_ENABLED);
		}

		for (const studentId of args.studentIds) {
			const student = await Student.getById(
				ctx,
				studentId,
				ctx.institution._id,
			);
			if (!student || student.classId !== cls._id) {
				throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
			}
		}

		const newBatch = await ClassBatch.createNextBatch(ctx, cls._id);

		for (const studentId of args.studentIds) {
			await ClassBatch.setBatch(ctx, {
				studentId,
				classId: cls._id,
				batchId: newBatch._id,
			});
		}

		return {
			_id: newBatch._id,
			classId: cls._id,
			numIdx: newBatch.numIdx,
			label: ClassBatch.getBatchLabel(
				newBatch.numIdx,
				cls.batchNamingConvention,
			),
			studentCount: args.studentIds.length,
		};
	},
});

/** Soft-mark batch for deletion and schedule cascade cleanup */
export const removeBatch = insMutation({
	permissions: ["class:update"],
	args: {
		batchId: vv.id("classBatches"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const batch = await ClassBatch.getByIdIncludingDeleting(ctx, args.batchId);
		if (!batch) {
			throwAppError(ERROR_CODES.BATCH.NOT_FOUND);
		}

		await Class.ensureInInstitution(ctx, batch.classId, ctx.institution._id);

		await ClassBatch.assertCanRemove(ctx, batch);
		await ClassBatch.markDeleting(ctx, args.batchId);
		await ctx.scheduler.runAfter(
			0,
			internal.class.mutations.deleteBatchCascade,
			{
				batchId: args.batchId,
			},
		);
		return null;
	},
});

/** Assign a program faculty member to a class subject allocation */
export const assignSubjectFaculty = insMutation({
	permissions: ["class:update"],
	args: {
		classId: vv.id("classes"),
		programSubjectId: vv.id("programSubjects"),
		facultyId: vv.id("faculty"),
	},
	returns: vv.id("classSubjectFaculty"),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		const programSubject = await ProgramSubject.getById(
			ctx,
			args.programSubjectId,
		);

		if (
			!programSubject ||
			programSubject.programId !== cls.programId ||
			programSubject.academicStageId !== cls.currentHeadStageId
		) {
			throwAppError(ERROR_CODES.CLASS_SUBJECT_FACULTY.INVALID_SUBJECT);
		}

		const programFaculty = await ProgramFaculty.findByProgramAndFaculty(
			ctx.db,
			cls.programId,
			args.facultyId,
		);

		if (!programFaculty) {
			throwAppError(ERROR_CODES.CLASS_SUBJECT_FACULTY.NOT_PROGRAM_FACULTY);
		}

		return await ClassSubjectFaculty.assign(ctx, {
			classId: args.classId,
			programSubjectId: args.programSubjectId,
			facultyId: args.facultyId,
		});
	},
});

/** Unassign a faculty member from a class subject allocation */
export const unassignSubjectFaculty = insMutation({
	permissions: ["class:update"],
	args: {
		classId: vv.id("classes"),
		programSubjectId: vv.id("programSubjects"),
		facultyId: vv.id("faculty"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		const programSubject = await ProgramSubject.getById(
			ctx,
			args.programSubjectId,
		);

		if (
			!programSubject ||
			programSubject.programId !== cls.programId ||
			programSubject.academicStageId !== cls.currentHeadStageId
		) {
			throwAppError(ERROR_CODES.CLASS_SUBJECT_FACULTY.INVALID_SUBJECT);
		}

		await ClassSubjectFaculty.remove(ctx, {
			classId: cls._id,
			programSubjectId: args.programSubjectId,
			facultyId: args.facultyId,
		});
		return null;
	},
});

/** Batched cascade deletion for a class marked with `isDeleting` */
export const deleteCascade = internalMutation({
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const hasMore = await Class.deleteCascadeBatch(ctx, args.classId);
		if (hasMore) {
			await ctx.scheduler.runAfter(0, internal.class.mutations.deleteCascade, {
				classId: args.classId,
			});
		}
		return null;
	},
});

/** Batched cascade deletion for a batch marked with `isDeleting` */
export const deleteBatchCascade = internalMutation({
	args: {
		batchId: vv.id("classBatches"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const hasMore = await ClassBatch.deleteCascadeBatch(ctx, args.batchId);
		if (hasMore) {
			await ctx.scheduler.runAfter(
				0,
				internal.class.mutations.deleteBatchCascade,
				{
					batchId: args.batchId,
				},
			);
		}
		return null;
	},
});
