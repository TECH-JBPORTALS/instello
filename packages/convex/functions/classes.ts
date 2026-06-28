import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Class from "./model/class";
import { vv } from "./schema";

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
		programId: vv.string(),
	},
	returns: vv.array(
		vv.object({
			_id: vv.id("classes"),
			name: vv.string(),
			description: vv.string(),
			isGroupsEnabled: vv.boolean(),
			academicYear: vv.number(),
			semester: vv.number(),
			status: vv.union(vv.literal("inactive"), vv.literal("active")),
			createdAt: vv.number(),
			updatedAt: vv.optional(vv.number()),
		}),
	),
	handler: async (ctx, args) => {},
});

/** Get class by id
 * @returns class
 * @throws convex error
 */
export const get = insQuery({
	permissions: ["class:view"],
	args: {
		id: vv.id("classes"),
	},
	returns: vv.object({
		_id: vv.id("classes"),
		name: vv.string(),
		description: vv.string(),
		isGroupsEnabled: vv.boolean(),
		academicYear: vv.number(),
		semester: vv.number(),
		status: vv.union(vv.literal("inactive"), vv.literal("active")),
		createdAt: vv.number(),
		updatedAt: vv.optional(vv.number()),
	}),
	handler: async (ctx, args) => {},
});

/** Update class Name and Description class by id
 * @returns class
 * @throws convex error
 */
export const updateBasicInfo = insMutation({
	permissions: ["class:update"],
	args: {
		id: vv.id("classes"),
		name: vv.string(),
		description: vv.string(),
	},
	returns: vv.object({
		_id: vv.id("classes"),
		name: vv.string(),
		description: vv.string(),
	}),
	handler: async (ctx, args) => {},
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
