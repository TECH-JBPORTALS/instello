import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import type { Doc, Id } from "@/_generated/dataModel";
import * as ClassBatch from "@/class/model/classBatch";
import { ERROR_CODES, throwAppError } from "@/helpers/constants";
import {
	validateIndianPhoneNumber,
	validateOptionalIndianPhoneNumber,
} from "@/helpers/phone";
import * as InstitutionStudentCategory from "@/institution/model/studentCategory";
import type { AppMutationCtx, AppQueryCtx } from "@/model/common.types";
import type {
	CreateInput,
	PaginatedStudentList,
	PatchAcademicInfoSchema,
	PatchContactInfoSchema,
	PatchFamilyInfoSchema,
	PatchPersonalInfoSchema,
	StudentDto,
} from "../validator/student";

export {
	CreateInputSchema,
	PaginatedStudentListSchema,
	PatchAcademicInfoSchema,
	PatchContactInfoSchema,
	PatchFamilyInfoSchema,
	PatchPersonalInfoSchema,
	StudentDtoSchema,
} from "../validator/student";
export type { CreateInput, PaginatedStudentList, StudentDto };

const APAAR_ID_PATTERN = /^\d{12}$/;

export function validateApaarId(apaarId: string | undefined) {
	if (apaarId === undefined || apaarId.trim() === "") return;
	if (!APAAR_ID_PATTERN.test(apaarId.trim())) {
		throwAppError(ERROR_CODES.STUDENT.INVALID_APAAR_ID);
	}
}

async function deleteStoredImage(
	ctx: AppMutationCtx,
	imageId: Doc<"students">["image"],
) {
	if (!imageId) return;
	await ctx.storage.delete(imageId);
}

export async function toDto(
	ctx: AppQueryCtx,
	student: Doc<"students">,
): Promise<StudentDto> {
	const category = await ctx.db.get(
		"institutionStudentCategories",
		student.categoryId,
	);

	const imageUrl = student.image
		? await ctx.storage.getUrl(student.image)
		: null;

	let batchLabel: string | undefined;

	if (student.batchId) {
		const batch = await ClassBatch.getById(ctx, student.batchId);
		if (batch) {
			const cls = await ctx.db.get("classes", student.classId);
			batchLabel = ClassBatch.getBatchLabel(
				batch.numIdx,
				cls?.batchNamingConvention,
			);
		}
	}

	return {
		_id: student._id,
		classId: student.classId,
		firstName: student.firstName,
		lastName: student.lastName,
		usn: student.usn,
		email: student.email,
		gender: student.gender,
		categoryId: student.categoryId,
		categoryName: category?.name ?? "Unknown",
		phoneNumber: student.phoneNumber,
		apaarId: student.apaarId,
		batchId: student.batchId,
		batchLabel,
		image: imageUrl ?? undefined,
		fatherName: student.fatherName,
		fatherPhoneNumber: student.fatherPhoneNumber,
		motherName: student.motherName,
		motherPhoneNumber: student.motherPhoneNumber,
		addressLine: student.addressLine,
		city: student.city,
		state: student.state,
		postalCode: student.postalCode,
		country: student.country,
		createdAt: student.createdAt,
		updatedAt: student.updatedAt,
	};
}

export async function findByUsn(
	ctx: AppQueryCtx | AppMutationCtx,
	usn: string,
) {
	return await ctx.db
		.query("students")
		.withIndex("by_usn", (q) => q.eq("usn", usn.trim()))
		.unique();
}

export async function findByEmail(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	email: string,
) {
	return await ctx.db
		.query("students")
		.withIndex("by_institution_and_email", (q) =>
			q.eq("institutionId", institutionId).eq("email", email.trim()),
		)
		.unique();
}

async function assertCategoryInInstitution(
	ctx: AppQueryCtx | AppMutationCtx,
	categoryId: Id<"institutionStudentCategories">,
	institutionId: string,
) {
	const category = await InstitutionStudentCategory.getById(
		ctx,
		categoryId,
		institutionId,
	);

	if (!category) {
		throwAppError(ERROR_CODES.STUDENT.CATEGORY_NOT_FOUND);
	}
}

export async function create(
	ctx: AppMutationCtx,
	args: CreateInput & {
		institutionId: string;
		createdBy: string;
	},
) {
	const usn = args.usn.trim();
	const email = args.email.trim();

	validateApaarId(args.apaarId);

	const existingUsn = await findByUsn(ctx, usn);
	if (existingUsn) {
		throwAppError(ERROR_CODES.STUDENT.USN_ALREADY_EXISTS);
	}

	const existingEmail = await findByEmail(ctx, args.institutionId, email);
	if (existingEmail) {
		throwAppError(ERROR_CODES.STUDENT.EMAIL_ALREADY_EXISTS);
	}

	await assertCategoryInInstitution(ctx, args.categoryId, args.institutionId);

	const phoneNumber = validateIndianPhoneNumber(args.phoneNumber);
	const fatherPhoneNumber = validateOptionalIndianPhoneNumber(
		args.fatherPhoneNumber,
	);
	const motherPhoneNumber = validateOptionalIndianPhoneNumber(
		args.motherPhoneNumber,
	);

	const now = Date.now();

	return await ctx.db.insert("students", {
		institutionId: args.institutionId,
		classId: args.classId,
		firstName: args.firstName.trim(),
		lastName: args.lastName.trim(),
		usn,
		email,
		gender: args.gender,
		categoryId: args.categoryId,
		phoneNumber,
		apaarId: args.apaarId?.trim() || undefined,
		image: args.image,
		fatherName: args.fatherName?.trim() || undefined,
		fatherPhoneNumber,
		motherName: args.motherName?.trim() || undefined,
		motherPhoneNumber,
		addressLine: args.addressLine?.trim() || undefined,
		city: args.city?.trim() || undefined,
		state: args.state?.trim() || undefined,
		postalCode: args.postalCode?.trim() || undefined,
		country: "India",
		createdBy: args.createdBy,
		createdAt: now,
		updatedAt: now,
	});
}

export async function list(
	ctx: AppQueryCtx,
	args: {
		classId: Id<"classes">;
		batchId?: Id<"classBatches">;
		paginationOpts: PaginationOptions;
	},
): Promise<PaginatedStudentList> {
	const result = args.batchId
		? await ctx.db
				.query("students")
				.withIndex("by_class_and_batch", (q) =>
					q.eq("classId", args.classId).eq("batchId", args.batchId),
				)
				.order("desc")
				.paginate(args.paginationOpts)
		: await ctx.db
				.query("students")
				.withIndex("by_class", (q) => q.eq("classId", args.classId))
				.order("desc")
				.paginate(args.paginationOpts);

	const page = await Promise.all(
		result.page.map((student) => toDto(ctx, student)),
	);

	return {
		page,
		isDone: result.isDone,
		continueCursor: result.continueCursor,
	};
}

export async function getById(
	ctx: AppQueryCtx,
	id: Id<"students">,
	institutionId?: string,
) {
	const student = await ctx.db.get("students", id);

	if (!student) return null;
	if (institutionId && student.institutionId !== institutionId) return null;

	return student;
}

export async function patchPersonalInfo(
	ctx: AppMutationCtx,
	student: Doc<"students">,
	body: Infer<typeof PatchPersonalInfoSchema>,
) {
	const updates: Partial<Doc<"students">> = {
		updatedAt: Date.now(),
	};

	if (body.firstName !== undefined) updates.firstName = body.firstName.trim();
	if (body.lastName !== undefined) updates.lastName = body.lastName.trim();
	if (body.gender !== undefined) updates.gender = body.gender;

	if (body.image !== undefined) {
		const nextImage = body.image === null ? undefined : body.image;

		if (student.image && student.image !== nextImage) {
			await deleteStoredImage(ctx, student.image);
		}

		updates.image = nextImage;
	}

	await ctx.db.patch("students", student._id, updates);
}

export async function patchContactInfo(
	ctx: AppMutationCtx,
	student: Doc<"students">,
	body: Infer<typeof PatchContactInfoSchema>,
) {
	if (body.email && body.email.trim() !== student.email) {
		const existing = await findByEmail(
			ctx,
			student.institutionId,
			body.email.trim(),
		);

		if (existing && existing._id !== student._id) {
			throwAppError(ERROR_CODES.STUDENT.EMAIL_ALREADY_EXISTS);
		}
	}

	const updates: Partial<Doc<"students">> = {
		updatedAt: Date.now(),
	};

	if (body.email !== undefined) updates.email = body.email.trim();
	if (body.phoneNumber !== undefined) {
		updates.phoneNumber = validateIndianPhoneNumber(body.phoneNumber);
	}

	await ctx.db.patch("students", student._id, updates);
}

export async function patchAcademicInfo(
	ctx: AppMutationCtx,
	student: Doc<"students">,
	body: Infer<typeof PatchAcademicInfoSchema>,
) {
	if (body.usn && body.usn.trim() !== student.usn) {
		const existing = await findByUsn(ctx, body.usn.trim());

		if (existing && existing._id !== student._id) {
			throwAppError(ERROR_CODES.STUDENT.USN_ALREADY_EXISTS);
		}
	}

	if (body.apaarId !== undefined) {
		validateApaarId(body.apaarId);
	}

	if (body.categoryId !== undefined) {
		await assertCategoryInInstitution(
			ctx,
			body.categoryId,
			student.institutionId,
		);
	}

	const updates: Partial<Doc<"students">> = {
		updatedAt: Date.now(),
	};

	if (body.usn !== undefined) updates.usn = body.usn.trim();
	if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
	if (body.apaarId !== undefined) {
		updates.apaarId = body.apaarId.trim() || undefined;
	}

	await ctx.db.patch("students", student._id, updates);
}

export async function patchFamilyInfo(
	ctx: AppMutationCtx,
	student: Doc<"students">,
	body: Infer<typeof PatchFamilyInfoSchema>,
) {
	const updates: Partial<Doc<"students">> = {
		updatedAt: Date.now(),
	};

	if (body.fatherName !== undefined) {
		updates.fatherName = body.fatherName.trim() || undefined;
	}
	if (body.fatherPhoneNumber !== undefined) {
		updates.fatherPhoneNumber = validateOptionalIndianPhoneNumber(
			body.fatherPhoneNumber,
		);
	}
	if (body.motherName !== undefined) {
		updates.motherName = body.motherName.trim() || undefined;
	}
	if (body.motherPhoneNumber !== undefined) {
		updates.motherPhoneNumber = validateOptionalIndianPhoneNumber(
			body.motherPhoneNumber,
		);
	}
	if (body.addressLine !== undefined) {
		updates.addressLine = body.addressLine.trim() || undefined;
	}
	if (body.city !== undefined) {
		updates.city = body.city.trim() || undefined;
	}
	if (body.state !== undefined) {
		updates.state = body.state.trim() || undefined;
	}
	if (body.postalCode !== undefined) {
		updates.postalCode = body.postalCode.trim() || undefined;
	}

	await ctx.db.patch("students", student._id, updates);
}
