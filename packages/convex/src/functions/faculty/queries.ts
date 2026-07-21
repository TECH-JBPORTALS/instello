import { paginationOptsValidator } from "convex/server";
import { ERROR_CODES, throwAppError } from "#helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Faculty from "./model/faculty";
import * as FacultyService from "./service/faculty";
import {
	FacultyResultSchema,
	PaginatedFacultyListSchema,
} from "./validator/faculty";

/** Lists faculty in the current institution
 * @returns paginated faculty records
 */
export const list = insQuery({
	permissions: ["faculty:view"],
	args: {
		paginationOpts: paginationOptsValidator,
		status: vv.optional(
			vv.union(
				vv.literal("draft"),
				vv.literal("invited"),
				vv.literal("active"),
				vv.literal("inactive"),
			),
		),
	},
	returns: PaginatedFacultyListSchema,
	handler: async (ctx, args) => {
		const faculty = await Faculty.list(ctx, {
			institutionId: ctx.institution._id,
			status: args.status,
			paginationOpts: args.paginationOpts,
		});

		return {
			...faculty,
			page: await Promise.all(
				faculty.page.map((f) => FacultyService.toDto(ctx, f)),
			),
		};
	},
});

/** Get faculty by id in the current institution
 * @returns faculty record
 */
export const getById = insQuery({
	permissions: ["faculty:view"],
	args: { id: vv.id("faculty") },
	returns: FacultyResultSchema,
	handler: async (ctx, args) => {
		const faculty = await Faculty.findOrThrow(ctx.db, args.id);

		if (faculty.institutionId !== ctx.institution._id) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		return await FacultyService.toDto(ctx, faculty);
	},
});

/** Get the designated principal faculty for the current institution
 * @returns principal faculty record, or null if none is designated
 */
export const getCurrentPrincipal = insQuery({
	permissions: ["faculty:view"],
	args: {},
	returns: vv.union(FacultyResultSchema, vv.null()),
	handler: async (ctx) => {
		const principal = await Faculty.findPrincipal(ctx, ctx.institution._id);

		if (!principal) return null;

		return await FacultyService.toDto(ctx, principal);
	},
});
