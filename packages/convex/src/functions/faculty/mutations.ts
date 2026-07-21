import { internalMutation } from "../_generated/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insMutation } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Faculty from "./model/faculty";
import {
	CreateInputSchema,
	PatchEmploymentSchema,
	PatchPersonalInfoSchema,
	PatchPhoneSchema,
} from "./validator/faculty";

/** Creates faculty in the current institution with all details in one call
 * @returns faculty id
 */
export const create = insMutation({
	permissions: ["faculty:create"],
	args: CreateInputSchema,
	returns: vv.id("faculty"),
	handler: async (ctx, args) => {
		return await Faculty.create(ctx, {
			...args,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
		});
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
		body: PatchPersonalInfoSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.find(ctx.db, args.id);

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
		body: PatchEmploymentSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.find(ctx.db, args.id);

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
		body: PatchPhoneSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.find(ctx.db, args.id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.patchPhone(ctx, faculty, args.body);
		return null;
	},
});

/** Mark draft faculty as invited after an org invitation is sent
 * @param id - faculty id
 */
export const invite = insMutation({
	permissions: ["faculty:create"],
	args: { id: vv.id("faculty") },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.find(ctx.db, args.id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		if (faculty.status !== "draft") {
			throwAppError(ERROR_CODES.FACULTY.NOT_DRAFT);
		}

		await Faculty.setStatus(ctx, faculty, "invited");
		return null;
	},
});

/** Revert invited faculty to draft after cancelling their invitation
 * @param id - faculty id
 */
export const cancelInvite = insMutation({
	permissions: ["faculty:create"],
	args: { id: vv.id("faculty") },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.find(ctx.db, args.id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		if (faculty.status === "draft") {
			return null;
		}

		if (faculty.status !== "invited") {
			throwAppError(ERROR_CODES.FACULTY.NOT_INVITED);
		}

		await Faculty.setStatus(ctx, faculty, "draft");
		return null;
	},
});

/** Designate faculty as the institution principal (demotes any existing principal)
 * @param id - faculty id
 */
export const setAsPrincipal = insMutation({
	permissions: ["faculty:activate"],
	args: { id: vv.id("faculty") },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const faculty = await Faculty.find(ctx.db, args.id);

		if (!faculty || faculty.institutionId !== ctx.institution._id) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.setAsPrincipal(ctx, faculty);
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
		const faculty = await Faculty.find(ctx.db, args.id);

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
		const faculty = await Faculty.find(ctx.db, args.id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		await Faculty.setStatus(ctx, faculty, "inactive");
		return null;
	},
});

/** Link a user to faculty and activate after invitation acceptance */
export const activateFromInvitation = internalMutation({
	args: {
		institutionId: vv.string(),
		email: vv.string(),
		userId: vv.string(),
	},
	returns: vv.union(vv.id("faculty"), vv.null()),
	handler: async (ctx, args) => {
		return await Faculty.activateFromInvitation(ctx, args);
	},
});

/** Revert faculty to draft after an invitation is cancelled */
export const revertToDraftFromInvitationCancellation = internalMutation({
	args: {
		institutionId: vv.string(),
		email: vv.string(),
	},
	returns: vv.union(vv.id("faculty"), vv.null()),
	handler: async (ctx, args) => {
		return await Faculty.revertToDraftFromInvitationCancellation(ctx, args);
	},
});
