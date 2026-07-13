import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insMutation } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Subject from "./model/subject";
import {
	CreateInputSchema,
	PatchAliasSchema,
	PatchCodeSchema,
	PatchColorSchema,
	PatchDescriptionSchema,
	PatchNameSchema,
} from "./validator/subject";

/** Creates subject in the current institution
 * @returns subject id
 */
export const create = insMutation({
	permissions: ["subject:create"],
	args: CreateInputSchema,
	returns: vv.id("subjects"),
	handler: async (ctx, args) => {
		return await Subject.create(ctx, {
			...args,
			institutionId: ctx.institution._id,
		});
	},
});

/** Update subject name
 * @param id - subject id to be updated
 * @param body - subject name mentioned in the body
 */
export const updateName = insMutation({
	permissions: ["subject:update"],
	args: {
		id: vv.id("subjects"),
		body: PatchNameSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const subject = await Subject.getById(ctx, args.id, ctx.institution._id);

		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		await Subject.patch(ctx, args.id, args.body);
		return null;
	},
});

/** Update subject code
 * @param id - subject id to be updated
 * @param body - subject code mentioned in the body
 */
export const updateCode = insMutation({
	permissions: ["subject:update"],
	args: {
		id: vv.id("subjects"),
		body: PatchCodeSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const subject = await Subject.getById(ctx, args.id, ctx.institution._id);

		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		await Subject.patch(ctx, args.id, args.body);
		return null;
	},
});

/** Update subject alias
 * @param id - subject id to be updated
 * @param body - subject alias mentioned in the body
 */
export const updateAlias = insMutation({
	permissions: ["subject:update"],
	args: {
		id: vv.id("subjects"),
		body: PatchAliasSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const subject = await Subject.getById(ctx, args.id, ctx.institution._id);

		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		await Subject.patch(ctx, args.id, args.body);
		return null;
	},
});

/** Update subject color
 * @param id - subject id to be updated
 * @param body - subject color mentioned in the body
 */
export const updateColor = insMutation({
	permissions: ["subject:update"],
	args: {
		id: vv.id("subjects"),
		body: PatchColorSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const subject = await Subject.getById(ctx, args.id, ctx.institution._id);

		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		await Subject.patch(ctx, args.id, args.body);
		return null;
	},
});

/** Update subject description
 * @param id - subject id to be updated
 * @param body - subject description mentioned in the body
 */
export const updateDescription = insMutation({
	permissions: ["subject:update"],
	args: {
		id: vv.id("subjects"),
		body: PatchDescriptionSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const subject = await Subject.getById(ctx, args.id, ctx.institution._id);

		if (!subject) {
			throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
		}

		await Subject.patch(ctx, args.id, args.body);
		return null;
	},
});
