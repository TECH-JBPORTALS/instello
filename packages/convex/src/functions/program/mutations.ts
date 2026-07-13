import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insMutation } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Program from "./model/program";
import {
	CreateInputSchema,
	PatchAliasSchema,
	PatchNameSchema,
} from "./validator/program";

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
