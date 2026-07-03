import { paginationOptsValidator } from "convex/server";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Class from "./model/class";
import * as ClassBatch from "./model/classBatch";
import * as Program from "./model/program";
import { vv } from "./schema";

/** Check if a class name is available in the current program */
export const checkName = insQuery({
	permissions: ["class:create"],
	args: {
		programId: vv.id("programs"),
		name: vv.string(),
	},
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const name = args.name.trim();
		if (!name) return { available: false };

		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		const existing = await Class.findByName(ctx, args.programId, name);

		return { available: existing === null };
	},
});

/** Check if a class slug is available in the current program */
export const checkSlug = insQuery({
	permissions: ["class:create"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
	},
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const classSlug = args.classSlug.trim();
		if (!classSlug) return { available: false };

		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		let normalizedSlug: string;
		try {
			normalizedSlug = Class.normalizeClassSlugForCheck(classSlug);
		} catch {
			return { available: false };
		}

		const existing = await Class.findBySlug(
			ctx,
			args.programId,
			normalizedSlug,
		);

		return { available: existing === null };
	},
});

/** Get class by slug within a program */
export const getBySlug = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
	},
	returns: Class.ClassDtoSchema,
	handler: async (ctx, args) => {
		const classSlug = args.classSlug.trim();
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		const cls = await Class.findBySlug(ctx, args.programId, classSlug);

		if (!cls) {
			throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
		}

		return await Class.toDto(ctx, cls);
	},
});

/** Creates class in the current program
 * @returns class id
 */
export const create = insMutation({
	permissions: ["class:create"],
	args: Class.CreateInputSchema,
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

/** List classes in the current program (paginated, searchable)
 * @returns paginated classes
 */
export const list = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		paginationOpts: paginationOptsValidator,
		searchQuery: vv.optional(vv.nullable(vv.string())),
	},
	returns: Class.PaginatedClassListSchema,
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return await Class.list(ctx, {
			programId: args.programId,
			query: args.searchQuery,
			paginationOpts: args.paginationOpts,
		});
	},
});

/** List classes for switcher dropdowns (non-paginated, up to 50) */
export const listForSwitcher = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
	},
	returns: vv.array(Class.ClassListItemSchema),
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return await Class.listForSwitcher(ctx, {
			programId: args.programId,
		});
	},
});

/** Get class by id
 * @returns class
 */
export const getById = insQuery({
	permissions: ["class:view"],
	args: {
		id: vv.id("classes"),
	},
	returns: Class.ClassDtoSchema,
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.id,
			ctx.institution._id,
		);

		return await Class.toDto(ctx, cls);
	},
});

/** Update class Name and Description class by id
 */
export const updateBasicInfo = insMutation({
	permissions: ["class:update"],
	args: {
		id: vv.id("classes"),
		body: Class.PatchBasicInfoSchema,
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

/** Enable batches for a class by id. Splits any existing students evenly across
 * two new batches, or leaves them empty if the class has no students yet.
 * @returns class
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
 * @returns class
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
