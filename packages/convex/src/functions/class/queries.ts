import { paginationOptsValidator } from "convex/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import * as Program from "../program/model/program";
import { vv } from "../schema";
import * as Class from "./model/class";
import * as ClassBatch from "./model/classBatch";
import {
	ClassDtoSchema,
	ClassListItemSchema,
	PaginatedClassListSchema,
} from "./validator/class";
import {
	BatchDtoSchema,
	MoveTargetDtoSchema,
	RemovePreviewSchema,
} from "./validator/classBatch";

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
	returns: ClassDtoSchema,
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

/** List classes in the current program (paginated, searchable) */
export const list = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		paginationOpts: paginationOptsValidator,
		searchQuery: vv.optional(vv.nullable(vv.string())),
	},
	returns: PaginatedClassListSchema,
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
	returns: vv.array(ClassListItemSchema),
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

/** Get class by id */
export const getById = insQuery({
	permissions: ["class:view"],
	args: {
		id: vv.id("classes"),
	},
	returns: ClassDtoSchema,
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.id,
			ctx.institution._id,
		);

		return await Class.toDto(ctx, cls);
	},
});

/** Lists the batches for a class, with labels computed from the class's naming convention. */
export const listBatches = insQuery({
	permissions: ["class:view"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(BatchDtoSchema),
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

/** Lists every valid bulk-move destination (batch or class) across the class's program. */
export const listBatchMoveTargets = insQuery({
	permissions: ["student:update"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(MoveTargetDtoSchema),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		return await ClassBatch.listMoveTargets(ctx, cls);
	},
});

/** Preview what happens when deleting a batch (student count and move target). */
export const getBatchRemovePreview = insQuery({
	permissions: ["class:view"],
	args: {
		batchId: vv.id("classBatches"),
	},
	returns: RemovePreviewSchema,
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
