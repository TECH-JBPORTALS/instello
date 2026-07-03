import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Class from "./model/class";
import * as ClassBatch from "./model/classBatch";
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
