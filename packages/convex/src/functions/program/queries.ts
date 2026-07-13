import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Program from "./model/program";
import { ProgramDtoSchema, ProgramListItemSchema } from "./validator/program";

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
