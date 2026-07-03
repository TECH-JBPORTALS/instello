import { paginationOptsValidator } from "convex/server";
import type { Id } from "./_generated/dataModel";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Class from "./model/class";
import * as InstitutionStudentCategory from "./model/institutionStudentCategory";
import * as Program from "./model/program";
import * as Student from "./model/student";
import { vv } from "./schema";

async function getClassInInstitution(
	ctx: Parameters<typeof Class.getById>[0],
	classId: Id<"classes">,
	institutionId: string,
) {
	const cls = await Class.getById(ctx, classId);

	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	const program = await Program.getById(
		ctx,
		cls.programId as Id<"programs">,
		institutionId,
	);

	if (!program) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	return cls;
}

/** Creates a student in the current institution for a class */
export const create = insMutation({
	permissions: ["student:create"],
	args: Student.CreateInputSchema,
	returns: vv.id("students"),
	handler: async (ctx, args) => {
		await getClassInInstitution(ctx, args.classId, ctx.institution._id);

		return await Student.create(ctx, {
			...args,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
		});
	},
});

/** Lists students in a class (paginated) */
export const list = insQuery({
	permissions: ["student:view"],
	args: {
		classId: vv.id("classes"),
		paginationOpts: paginationOptsValidator,
	},
	returns: Student.PaginatedStudentListSchema,
	handler: async (ctx, args) => {
		await getClassInInstitution(ctx, args.classId, ctx.institution._id);

		return await Student.list(ctx, {
			classId: args.classId,
			paginationOpts: args.paginationOpts,
		});
	},
});

/** Get student by id in the current institution */
export const getById = insQuery({
	permissions: ["student:view"],
	args: { id: vv.id("students") },
	returns: Student.StudentDtoSchema,
	handler: async (ctx, args) => {
		const student = await Student.getById(ctx, args.id, ctx.institution._id);

		if (!student) {
			throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
		}

		return await Student.toDto(ctx, student);
	},
});

/** Update student personal info */
export const updatePersonalInfo = insMutation({
	permissions: ["student:update"],
	args: {
		id: vv.id("students"),
		body: Student.PatchPersonalInfoSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const student = await Student.getById(ctx, args.id, ctx.institution._id);

		if (!student) {
			throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
		}

		await Student.patchPersonalInfo(ctx, student, args.body);
		return null;
	},
});

/** Update student contact info */
export const updateContactInfo = insMutation({
	permissions: ["student:update"],
	args: {
		id: vv.id("students"),
		body: Student.PatchContactInfoSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const student = await Student.getById(ctx, args.id, ctx.institution._id);

		if (!student) {
			throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
		}

		await Student.patchContactInfo(ctx, student, args.body);
		return null;
	},
});

/** Update student academic info */
export const updateAcademicInfo = insMutation({
	permissions: ["student:update"],
	args: {
		id: vv.id("students"),
		body: Student.PatchAcademicInfoSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const student = await Student.getById(ctx, args.id, ctx.institution._id);

		if (!student) {
			throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
		}

		await Student.patchAcademicInfo(ctx, student, args.body);
		return null;
	},
});

/** Update student family and address info */
export const updateFamilyInfo = insMutation({
	permissions: ["student:update"],
	args: {
		id: vv.id("students"),
		body: Student.PatchFamilyInfoSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const student = await Student.getById(ctx, args.id, ctx.institution._id);

		if (!student) {
			throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
		}

		await Student.patchFamilyInfo(ctx, student, args.body);
		return null;
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

/** Seeds default categories if none exist, then returns the list */
export const ensureCategories = insMutation({
	permissions: ["student:view"],
	args: {},
	returns: vv.array(InstitutionStudentCategory.CategoryDtoSchema),
	handler: async (ctx) => {
		await InstitutionStudentCategory.seedDefaults(ctx, ctx.institution._id);
		return await InstitutionStudentCategory.listByInstitution(
			ctx,
			ctx.institution._id,
		);
	},
});

/** Returns a short-lived URL for uploading a student profile image */
export const generateImageUploadUrl = insMutation({
	permissions: ["student:update"],
	args: {},
	returns: vv.string(),
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});
