import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Program from "./model/program";
import { vv } from "./schema";

/** Creates program in the current institution
 * @returns program id
 */
export const create = insMutation({
	permissions: ["program:create"],
	args: Program.CreateInputSchema,
	returns: vv.id("programs"),
	handler: async (ctx, args) => {
		return await Program.create(ctx, {
			...args,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
		});
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
	returns: vv.array(Program.ProgramListItemSchema),
	handler: async (ctx, args) => {
		return await Program.list(ctx, {
			institutionId: ctx.institution._id,
			query: args.query,
		});
	},
});

/** Get the program by id
 * @param id - program id
 * @returns program
 */
export const getById = insQuery({
	permissions: ["program:view"],
	args: { id: vv.id("programs") },
	returns: Program.ProgramDtoSchema,
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id, ctx.institution._id);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return Program.toDto(program);
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
		body: Program.PatchNameSchema,
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
		body: Program.PatchAliasSchema,
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
