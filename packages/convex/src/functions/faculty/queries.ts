import { paginationOptsValidator } from "convex/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Faculty from "./model/faculty";
import {
	FacultyDtoSchema,
	PaginatedFacultyListSchema,
} from "./validator/faculty";

/** Lists faculty in the current institution
 * @returns paginated faculty records
 */
export const list = insQuery({
	permissions: ["faculty:view"],
	args: {
		paginationOpts: paginationOptsValidator,
		status: vv.optional(vv.union(vv.literal("active"), vv.literal("inactive"))),
	},
	returns: PaginatedFacultyListSchema,
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
	returns: FacultyDtoSchema,
	handler: async (ctx, args) => {
		const faculty = await Faculty.getById(ctx, args.id, ctx.institution._id);

		if (!faculty) {
			throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);
		}

		return await Faculty.toDto(ctx, faculty);
	},
});
