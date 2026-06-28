import { ConvexError } from "convex/values";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Class from "./model/class";
import { vv } from "./schema";
import { ERROR_CODES } from "./helpers/errors";

/** Creates class in the current program
 * @returns class id
 * @throws convex error
 */
export const create = insMutation({
	permissions: ["class:create"],
	args: {
		programId: vv.id("programs"),
		body: vv.object({
			name: vv.string(),
			description: vv.string(),
			academicYear: vv.number(),
			semester: vv.number(),
		}),
	},
	returns: vv.id("classes"),
	handler: async (ctx, args) => {
		return await Class.create(ctx, {
			programId: args.programId,
			body: args.body,
		});
	},
});

/** List classes in the current program
 * @returns classes
 * @throws convex error
 */
export const list = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
	},
	returns: vv.array(
		vv.object({
			_id: vv.id("classes"),
			name: vv.string(),
			description: vv.optional(vv.string()),
			isGroupsEnabled: vv.boolean(),
			academicYear: vv.number(),
			semester: vv.number(),
			status: vv.union(vv.literal("inactive"), vv.literal("active")),
			createdAt: vv.number(),
			updatedAt: vv.optional(vv.number()),
		}),
	),
	handler: async (ctx, args) => {
		const classList = await Class.list(ctx, {
			programId: args.programId,
		});
		return classList.map((cls) => ({
			_id: cls._id,
			name: cls.name,
			description: cls.description,
			isGroupsEnabled: cls.isGroupsEnabled,
			academicYear: cls.academicYear,
			semester: cls.semester,
			status: cls.status,
			createdAt: cls.createdAt,
			updatedAt: cls.updatedAt,
		}));
	},
});

/** Get class by id
 * @returns class
 * @throws convex error
 */
export const getById = insQuery({
	permissions: ["class:view"],
	args: {
		id: vv.id("classes"),
	},
	returns: vv.object({
		_id: vv.id("classes"),
		name: vv.string(),
		description: vv.optional(vv.string()),
		isGroupsEnabled: vv.boolean(),
		academicYear: vv.number(),
		semester: vv.number(),
		status: vv.union(vv.literal("inactive"), vv.literal("active")),
		createdAt: vv.number(),
		updatedAt: vv.optional(vv.number()),
	}),
	handler: async (ctx, args) => {
		const cls = await Class.getById(ctx, args.id);
		if (!cls) throw new ConvexError(ERROR_CODES.BASE.CLASS_NOT_FOUND.message);
		return {
			_id: cls._id,
			name: cls.name,
			description: cls.description,
			isGroupsEnabled: cls.isGroupsEnabled,
			academicYear: cls.academicYear,
			semester: cls.semester,
			status: cls.status,
			createdAt: cls.createdAt,
			updatedAt: cls.updatedAt,
		};
	},
});

/** Update class Name and Description class by id
 * @returns class
 * @throws convex error
 */
export const updateBasicInfo = insMutation({
	permissions: ["class:update"],
	args: {
		id: vv.id("classes"),
		body: vv.object({
			name: vv.optional(vv.string()),
			description: vv.optional(vv.string()),
		}),
	},
	handler: async (ctx, args) => {
		const cls = await Class.getById(ctx, args.id);

		if (!cls) throw new ConvexError("Class not found");

		await Class.patch(ctx, args.id, args.body);
	},
});

/** Enable Section Groups for a class by id
 * @returns class
 * @throws convex error
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
	handler: async (ctx, args) => {},
});

/** Disable Section Groups for a class by id
 * @returns class
 * @throws convex error
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
	handler: async (ctx, args) => {},
});
