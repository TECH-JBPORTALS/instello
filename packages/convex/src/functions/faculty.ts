import { paginationOptsValidator } from "convex/server";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Faculty from "./model/faculty";
import { vv } from "./schema";

/** Creates faculty in the current institution with all details in one call
 * @returns faculty id
 */
export const create = insMutation({
	permissions: ["faculty:create"],
	args: Faculty.CreateInputSchema,
	returns: vv.id("faculty"),
	handler: async (ctx, args) => {
		return await Faculty.create(ctx, {
			...args,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
		});
	},
});

/** Lists faculty in the current institution
 * @returns paginated faculty records
 */
export const list = insQuery({
	permissions: ["faculty:view"],
	args: {
		paginationOpts: paginationOptsValidator,
		status: vv.optional(vv.union(vv.literal("active"), vv.literal("inactive"))),
	},
	returns: Faculty.PaginatedFacultyListSchema,
	handler: async (ctx, args) => {
		return await Faculty.list(ctx, {
			institutionId: ctx.institution._id,
			status: args.status,
			paginationOpts: args.paginationOpts,
		});
	},
});

/** Get faculty by id in the current institution
 * @returns faculty record
 */
export const getById = insQuery({
	permissions: ["faculty:view"],
	args: { id: vv.id("faculty") },
	returns: Faculty.FacultyDtoSchema,
	handler: async (ctx, args) => {
		const faculty = await Faculty.getById(ctx, args.id, ctx.institution._id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		return await Faculty.toDto(ctx, faculty);
	},
});

/** Returns a short-lived URL for uploading a faculty profile image */
export const generateImageUploadUrl = insMutation({
	permissions: ["faculty:update"],
	args: {},
	returns: vv.string(),
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

/** Update faculty personal info
 * @param id - faculty id
 * @param body - personal info fields to update
 */
export const updatePersonalInfo = insMutation({
	permissions: ["faculty:update"],
	args: {
		id: vv.id("faculty"),
		body: Faculty.PatchPersonalInfoSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.getById(ctx, args.id, ctx.institution._id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.patchPersonalInfo(ctx, faculty, args.body);
		return null;
	},
});

/** Update faculty employment details
 * @param id - faculty id
 * @param body - employment fields to update
 */
export const updateEmployment = insMutation({
	permissions: ["faculty:update"],
	args: {
		id: vv.id("faculty"),
		body: Faculty.PatchEmploymentSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.getById(ctx, args.id, ctx.institution._id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.patchEmployment(ctx, faculty, args.body);
		return null;
	},
});

/** Update faculty phone number (resets verified to false)
 * @param id - faculty id
 * @param body - phone number
 */
export const updatePhoneNumber = insMutation({
	permissions: ["faculty:update"],
	args: {
		id: vv.id("faculty"),
		body: Faculty.PatchPhoneSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.getById(ctx, args.id, ctx.institution._id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.patchPhone(ctx, faculty, args.body);
		return null;
	},
});

/** Activate faculty
 * @param id - faculty id
 */
export const activate = insMutation({
	permissions: ["faculty:activate"],
	args: { id: vv.id("faculty") },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.getById(ctx, args.id, ctx.institution._id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.setStatus(ctx, faculty, "active");
		return null;
	},
});

/** Deactivate faculty
 * @param id - faculty id
 */
export const deactivate = insMutation({
	permissions: ["faculty:activate"],
	args: { id: vv.id("faculty") },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.getById(ctx, args.id, ctx.institution._id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.setStatus(ctx, faculty, "inactive");
		return null;
	},
});
