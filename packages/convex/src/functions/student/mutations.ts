import * as Class from "../class/model/class";
import * as ClassBatch from "../class/model/classBatch";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insMutation } from "../helpers/customFunctions";
import * as InstitutionStudentCategory from "../institution/model/studentCategory";
import { vv } from "../schema";
import * as Student from "./model/student";
import {
	CreateInputSchema,
	PatchAcademicInfoSchema,
	PatchContactInfoSchema,
	PatchFamilyInfoSchema,
	PatchPersonalInfoSchema,
} from "./validator/student";

/** Creates a student in the current institution for a class */
export const create = insMutation({
	permissions: ["student:create"],
	args: CreateInputSchema,
	returns: vv.id("students"),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		if (!cls.isGroupsEnabled && args.batchId) {
			throwAppError(ERROR_CODES.CLASS.BATCHES_NOT_ENABLED);
		}

		let batchId = args.batchId;

		if (cls.isGroupsEnabled) {
			if (batchId) {
				await ClassBatch.ensureInClass(ctx, batchId, cls._id);
			} else {
				const leastPopulated = await ClassBatch.pickLeastPopulatedBatch(
					ctx,
					cls._id,
				);
				batchId = leastPopulated?._id;
			}
		}

		const studentId = await Student.create(ctx, {
			...args,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
		});

		if (batchId) {
			await ClassBatch.setBatch(ctx, { studentId, classId: cls._id, batchId });
		}

		return studentId;
	},
});

/** Update student personal info */
export const updatePersonalInfo = insMutation({
	permissions: ["student:update"],
	args: {
		id: vv.id("students"),
		body: PatchPersonalInfoSchema,
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
		body: PatchContactInfoSchema,
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
		body: PatchAcademicInfoSchema,
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
		body: PatchFamilyInfoSchema,
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

/** Moves a set of students into another class, optionally into a specific batch of that class. */
export const bulkMove = insMutation({
	permissions: ["student:update"],
	args: {
		studentIds: vv.array(vv.id("students")),
		targetClassId: vv.id("classes"),
		targetBatchId: vv.optional(vv.id("classBatches")),
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const targetClass = await Class.ensureInInstitution(
			ctx,
			args.targetClassId,
			ctx.institution._id,
		);

		if (args.targetBatchId) {
			await ClassBatch.ensureInClass(ctx, args.targetBatchId, targetClass._id);
		} else if (targetClass.isGroupsEnabled) {
			throwAppError(ERROR_CODES.CLASS.BATCH_REQUIRED);
		}

		for (const studentId of args.studentIds) {
			const student = await Student.getById(
				ctx,
				studentId,
				ctx.institution._id,
			);
			if (!student) {
				throwAppError(ERROR_CODES.STUDENT.NOT_FOUND);
			}

			if (args.targetBatchId) {
				await ClassBatch.setBatch(ctx, {
					studentId,
					classId: targetClass._id,
					batchId: args.targetBatchId,
				});
			} else {
				await ctx.db.patch("students", studentId, {
					classId: targetClass._id,
					batchId: undefined,
					updatedAt: Date.now(),
				});
			}
		}

		return null;
	},
});
