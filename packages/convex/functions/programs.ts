import { ConvexError } from "convex/values";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Program from "./model/program";
import { vv } from "./schema";

/** Creates program in the current institution
 * @returns program id
 * @throws convex error
 */
export const create = insMutation({
	permissions: ["program:create"],
	args: {
		name: vv.string(),
		alias: vv.string(),
	},
	returns: vv.id("programs"),
	handler: async (ctx, args) => {
		return await Program.create(ctx, {
			...args,
			institutionId: ctx.session.activeInstitutionId,
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
	returns: vv.array(
		vv.object({
			_id: vv.id("programs"),
			name: vv.string(),
			alias: vv.string(),
			createdAt: vv.number(),
			status: vv.union(vv.literal("active"), vv.literal("inactive")),
			user: vv.object({
				_id: vv.string(),
				name: vv.string(),
				email: vv.string(),
				image: vv.nullable(vv.string()),
			}),
		}),
	),
	handler: async (ctx, args) => {
		return await Program.list(ctx, {
			institutionId: ctx.session.activeInstitutionId,
			query: args?.query,
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
	returns: vv.object({
		_id: vv.id("programs"),
		name: vv.string(),
		alias: vv.string(),
		status: vv.union(vv.literal("active"), vv.literal("inactive")),
		createdAt: vv.number(),
	}),
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id);

		if (!program) throw new ConvexError("Program not found");

		return {
			_id: program._id,
			name: program.name,
			alias: program.alias,
			status: program.status,
			createdAt: program.createdAt,
		};
	},
});

/** Update program name
 * @param id - program id to be updated
 * @param body - program name mentioned in the body
 * @returns updated program
 * @throws convex error
 */
export const updateName = insMutation({
	permissions: ["program:update"],
	args: {
		id: vv.id("programs"),
		body: vv.object({ name: vv.string() }),
	},
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id);

		if (!program) throw new ConvexError("Program not found");

		await Program.patch(ctx, args.id, args.body);
	},
});

/** Update program alias
 * @param id - program id to be updated
 * @param body - program alias mentioned in the body
 * @returns updated program
 * @throws convex error
 */
export const updateAlias = insMutation({
	permissions: ["program:update"],
	args: {
		id: vv.id("programs"),
		body: vv.object({ alias: vv.string() }),
	},
	handler: async (ctx, args) => {
		const program = await Program.getById(ctx, args.id);

		if (!program) throw new ConvexError("Program not found");

		await Program.patch(ctx, args.id, args.body);
	},
});
