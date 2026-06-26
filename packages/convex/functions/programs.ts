import { ConvexError } from "convex/values";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Program from "./model/program";
import { vv } from "./schema";

/** Creates program in the current institution
 * @returns program id
 * @throws convex error
 */
export const create = insMutation({
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
	args: {},
	returns: vv.array(
		vv.object({
			_id: vv.id("programs"),
			name: vv.string(),
			alias: vv.string(),
			createdAt: vv.string(),
			user: vv.object({
				_id: vv.string(),
				name: vv.string(),
				image: vv.string(),
			}),
		}),
	),
	handler: (ctx, args) => {
		return new ConvexError("Not implemented");
	},
});

/** Get the program by id
 * @param id - program id
 * @returns program
 */
export const getById = insQuery({
	args: { id: vv.id("programs") },
	returns: vv.object({
		_id: vv.id("programs"),
		name: vv.string(),
		alias: vv.string(),
		createdAt: vv.string(),
	}),
	handler: (ctx, args) => {
		return new ConvexError("Not implemented");
	},
});

/** Update program name
 * @param id - program id to be updated
 * @param body - program name mentioned in the body
 * @returns updated program
 * @throws convex error
 */
export const updateName = insMutation({
	args: {
		id: vv.string(),
		body: vv.object({ name: vv.string() }),
	},
	returns: vv.object({
		_id: vv.id("programs"),
		name: vv.string(),
		alias: vv.string(),
		createdAt: vv.string(),
		updatedAt: vv.string(),
	}),
	handler: (ctx, args) => {
		return new ConvexError("Not implemented");
	},
});

/** Update program alias
 * @param id - program id to be updated
 * @param body - program alias mentioned in the body
 * @returns updated program
 * @throws convex error
 */
export const updateAlias = insMutation({
	args: {
		id: vv.string(),
		body: vv.object({ alias: vv.string() }),
	},
	returns: vv.object({
		_id: vv.id("programs"),
		name: vv.string(),
		alias: vv.string(),
		createdAt: vv.string(),
		updatedAt: vv.string(),
	}),
	handler: (ctx, args) => {
		return new ConvexError("Not implemented");
	},
});
