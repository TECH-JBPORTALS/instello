import { paginationOptsValidator } from "convex/server";
import * as Class from "../class/model/class";
import * as ClassBatch from "../class/model/classBatch";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import * as InstitutionStudentCategory from "../institution/model/studentCategory";
import { vv } from "../schema";
import * as Student from "./model/student";
import {
	PaginatedStudentListSchema,
	StudentDtoSchema,
} from "./validator/student";

/** Lists students in a class (paginated), optionally scoped to a single batch */
export const list = insQuery({
	permissions: ["student:view"],
	args: {
		classId: vv.id("classes"),
		batchId: vv.optional(vv.id("classBatches")),
		paginationOpts: paginationOptsValidator,
	},
	returns: PaginatedStudentListSchema,
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		if (args.batchId) {
			await ClassBatch.ensureInClass(ctx, args.batchId, cls._id);
		}

		return await Student.list(ctx, {
			classId: args.classId,
			batchId: args.batchId,
			paginationOpts: args.paginationOpts,
		});
	},
});

/** Get student by id in the current institution */
export const getById = insQuery({
	permissions: ["student:view"],
	args: { id: vv.id("students") },
	returns: StudentDtoSchema,
	handler: async (ctx, args) => {
		const student = await Student.getById(ctx, args.id, ctx.institution._id);

		if (!student) {
			throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
		}

		return await Student.toDto(ctx, student);
	},
});

/** Lists student categories for the institution */
export const listCategories = insQuery({
	permissions: ["student:view"],
	args: {},
	returns: vv.array(InstitutionStudentCategory.CategoryDtoSchema),
	handler: async (ctx) => {
		return await InstitutionStudentCategory.listByInstitution(
			ctx,
			ctx.institution._id,
		);
	},
});
