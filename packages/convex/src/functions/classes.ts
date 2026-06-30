import type { Id } from "./_generated/dataModel";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Class from "./model/class";
import * as Program from "./model/program";
import { vv } from "./schema";

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

		return await Class.create(ctx, {
			programId: args.programId,
			body: args.body,
		});
	},
});

/** List classes in the current program
 * @returns classes
 */
export const list = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
	},
	returns: vv.array(Class.ClassDtoSchema),
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
		const cls = await Class.getById(ctx, args.id);

		if (!cls) {
			throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
		}

		const program = await Program.getById(
			ctx,
			cls.programId as Id<"programs">,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
		}

		return Class.toDto(cls);
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
		const cls = await Class.getById(ctx, args.id);

		if (!cls) {
			throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
		}

		const program = await Program.getById(
			ctx,
			cls.programId as Id<"programs">,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
		}

		await Class.patch(ctx, args.id, args.body);
		return null;
	},
});

/** Enable Section Groups for a class by id
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
	/** @ts-expect-error - TODO: Implement this. Once implemented please remove this line */
	handler: async (_ctx, _args) => {},
});

/** Disable Section Groups for a class by id
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
	/** @ts-expect-error - TODO: Implement this. Once implemented please remove this line */
	handler: async (_ctx, _args) => {},
});
