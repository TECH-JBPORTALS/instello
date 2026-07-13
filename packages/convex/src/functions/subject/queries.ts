import { paginationOptsValidator } from "convex/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Subject from "./model/subject";
import {
	PaginatedSubjectListSchema,
	SubjectDtoSchema,
} from "./validator/subject";

/** Check if a subject alias is available in the current institution */
export const checkAlias = insQuery({
	permissions: ["subject:create"],
	args: { alias: vv.string() },
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const alias = args.alias.trim();
		if (!alias) return { available: false };

		const existing = await Subject.findByAlias(ctx, ctx.institution._id, alias);

		return { available: existing === null };
	},
});

/** Check if a subject code is available in the current institution */
export const checkCode = insQuery({
	permissions: ["subject:create"],
	args: { code: vv.string() },
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const code = args.code.trim().toUpperCase();
		if (!code) return { available: false };

		const existing = await Subject.findByCode(ctx, ctx.institution._id, code);

		return { available: existing === null };
	},
});

/** Lists subjects in the current institution
 * @returns paginated subjects
 */
export const list = insQuery({
	permissions: ["subject:view"],
	args: {
		paginationOpts: paginationOptsValidator,
		query: vv.optional(vv.nullable(vv.string())),
	},
	returns: PaginatedSubjectListSchema,
	handler: async (ctx, args) => {
		return await Subject.list(ctx, {
			institutionId: ctx.institution._id,
			query: args.query,
			paginationOpts: args.paginationOpts,
		});
	},
});

/** Get the subject by alias in the current institution
 * @param alias - subject alias
 * @returns subject
 */
export const getByAlias = insQuery({
	permissions: ["subject:view"],
	args: { alias: vv.string() },
	returns: SubjectDtoSchema,
	handler: async (ctx, args) => {
		const alias = args.alias.trim();
		const subject = await Subject.findByAlias(ctx, ctx.institution._id, alias);

		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		return Subject.toDto(subject);
	},
});

/** Get the subject by id
 * @param id - subject id
 * @returns subject
 */
export const getById = insQuery({
	permissions: ["subject:view"],
	args: { id: vv.id("subjects") },
	returns: SubjectDtoSchema,
	handler: async (ctx, args) => {
		const subject = await Subject.getById(ctx, args.id, ctx.institution._id);

		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		return Subject.toDto(subject);
	},
});
