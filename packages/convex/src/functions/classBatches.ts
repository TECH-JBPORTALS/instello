import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Class from "./model/class";
import * as ClassBatch from "./model/classBatch";
import * as Student from "./model/student";
import { vv } from "./schema";

/** Lists the batches for a class, with labels computed from the class's naming convention. */
export const list = insQuery({
	permissions: ["class:view"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(ClassBatch.BatchDtoSchema),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		return await ClassBatch.listByClass(
			ctx,
			cls._id,
			cls.batchNamingConvention,
		);
	},
});

/** Updates how batch labels are displayed for a class. */
export const updateNamingConvention = insMutation({
	permissions: ["class:update"],
	args: {
		classId: vv.id("classes"),
		namingConvention: ClassBatch.BatchNamingConventionSchema,
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

/** Lists every valid bulk-move destination (batch or class) across the class's program. */
export const listMoveTargets = insQuery({
	permissions: ["student:update"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(ClassBatch.MoveTargetDtoSchema),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		return await ClassBatch.listMoveTargets(ctx, cls);
	},
});

/** Creates the next batch in a class and moves the given students into it. */
export const splitIntoNewBatch = insMutation({
	permissions: ["student:update"],
	args: {
		classId: vv.id("classes"),
		studentIds: vv.array(vv.id("students")),
	},
	returns: ClassBatch.BatchDtoSchema,
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

/** Preview what happens when deleting a batch (student count and move target). */
export const getRemovePreview = insQuery({
	permissions: ["class:view"],
	args: {
		batchId: vv.id("classBatches"),
	},
	returns: ClassBatch.RemovePreviewSchema,
	handler: async (ctx, args) => {
		const batch = await ClassBatch.getByIdIncludingDeleting(ctx, args.batchId);
		if (!batch) {
			throwAppError(ERROR_CODES.BATCH.NOT_FOUND);
		}

		const cls = await Class.ensureInInstitution(
			ctx,
			batch.classId,
			ctx.institution._id,
		);

		if (!cls.isGroupsEnabled) {
			throwAppError(ERROR_CODES.CLASS.BATCHES_NOT_ENABLED);
		}

		return await ClassBatch.getRemovePreview(
			ctx,
			batch,
			cls.batchNamingConvention ?? "numeric",
		);
	},
});

/** Soft-mark batch for deletion and schedule cascade cleanup */
export const remove = insMutation({
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
		await ctx.scheduler.runAfter(0, internal.classBatches.deleteCascade, {
			batchId: args.batchId,
		});
		return null;
	},
});

/** Batched cascade deletion for a batch marked with `isDeleting` */
export const deleteCascade = internalMutation({
	args: {
		batchId: vv.id("classBatches"),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const hasMore = await ClassBatch.deleteCascadeBatch(ctx, args.batchId);
		if (hasMore) {
			await ctx.scheduler.runAfter(0, internal.classBatches.deleteCascade, {
				batchId: args.batchId,
			});
		}
		return null;
	},
});
