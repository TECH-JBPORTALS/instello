import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import { validateIndianPhoneNumber } from "../../helpers/phone";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import { vv } from "../../schema";
import type {
	CreateInput,
	FacultyDto,
	PaginatedFacultyList,
	PatchEmploymentSchema,
	PatchPersonalInfoSchema,
	PatchPhoneSchema,
} from "../validator/faculty";

export {
	CreateInputSchema,
	FacultyDtoSchema,
	PaginatedFacultyListSchema,
	PatchEmploymentSchema,
	PatchPersonalInfoSchema,
	PatchPhoneSchema,
} from "../validator/faculty";
export type { CreateInput, FacultyDto, PaginatedFacultyList };

export const CreateSchema = vv
	.doc("faculty")
	.pick(
		"staffId",
		"firstName",
		"lastName",
		"dateOfBirth",
		"email",
		"image",
		"designation",
		"joinedDate",
		"qualification",
		"specialization",
		"institutionId",
		"createdBy",
	);

async function deleteStoredImage(
	ctx: AppMutationCtx,
	imageId: Doc<"faculty">["image"],
) {
	if (!imageId) return;
	await ctx.storage.delete(imageId);
}

export async function toDto(
	ctx: AppQueryCtx,
	faculty: Doc<"faculty">,
): Promise<FacultyDto> {
	const imageUrl = faculty.image
		? await ctx.storage.getUrl(faculty.image)
		: null;

	return {
		_id: faculty._id,
		staffId: faculty.staffId,
		firstName: faculty.firstName,
		lastName: faculty.lastName,
		dateOfBirth: faculty.dateOfBirth,
		email: faculty.email,
		image: imageUrl ?? undefined,
		designation: faculty.designation,
		joinedDate: faculty.joinedDate,
		qualification: faculty.qualification,
		specialization: faculty.specialization,
		phone: faculty.phone,
		status: faculty.status,
		createdAt: faculty.createdAt,
		updatedAt: faculty.updatedAt,
	};
}

/**
 * **Find faculty by email within an institution**
 * @returns null if no matching faculty exists
 */
export async function findByEmail(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	email: string,
) {
	return await ctx.db
		.query("faculty")
		.withIndex("by_institution_and_email", (q) =>
			q.eq("institutionId", institutionId).eq("email", email),
		)
		.unique();
}

/**
 * **Find faculty by staff ID within an institution**
 * @returns null if no matching faculty exists
 */
export async function findByStaffId(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	staffId: string,
) {
	return await ctx.db
		.query("faculty")
		.withIndex("by_institution_and_staff_id", (q) =>
			q.eq("institutionId", institutionId).eq("staffId", staffId),
		)
		.unique();
}

/**
 * **Create faculty**
 * @returns faculty id
 */
export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof CreateSchema> & { phoneNumber: string },
) {
	const existingEmail = await findByEmail(ctx, args.institutionId, args.email);

	if (existingEmail) {
		throwAppError(ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS);
	}

	const existingStaffId = await findByStaffId(
		ctx,
		args.institutionId,
		args.staffId,
	);

	if (existingStaffId) {
		throwAppError(ERROR_CODES.FACULTY.STAFF_ID_ALREADY_EXISTS);
	}

	const now = Date.now();
	const phoneNumber = validateIndianPhoneNumber(args.phoneNumber);

	return await ctx.db.insert("faculty", {
		staffId: args.staffId,
		firstName: args.firstName,
		lastName: args.lastName,
		dateOfBirth: args.dateOfBirth,
		email: args.email,
		image: args.image,
		designation: args.designation,
		joinedDate: args.joinedDate,
		qualification: args.qualification,
		specialization: args.specialization,
		institutionId: args.institutionId,
		createdBy: args.createdBy,
		phone: { number: phoneNumber, verified: false },
		status: "active",
		createdAt: now,
		updatedAt: now,
	});
}

/**
 * **List faculty for institution**
 * @returns paginated faculty DTOs
 */
export async function list(
	ctx: AppQueryCtx,
	args: {
		institutionId: string;
		status?: "active" | "inactive";
		paginationOpts: PaginationOptions;
	},
): Promise<PaginatedFacultyList> {
	const { institutionId, status, paginationOpts } = args;

	const query = status
		? ctx.db
				.query("faculty")
				.withIndex("by_institution_and_status_and_staff_id", (q) =>
					q.eq("institutionId", institutionId).eq("status", status),
				)
		: ctx.db
				.query("faculty")
				.withIndex("by_institution_and_staff_id", (q) =>
					q.eq("institutionId", institutionId),
				);

	const result = await query.order("asc").paginate(paginationOpts);

	return {
		page: await Promise.all(result.page.map((f) => toDto(ctx, f))),
		isDone: result.isDone,
		continueCursor: result.continueCursor,
	};
}

/**
 * **Get faculty by id**
 * @returns null if faculty does not exist or does not belong to institutionId
 */
export async function getById(
	ctx: AppQueryCtx,
	id: Id<"faculty">,
	institutionId?: string,
) {
	const faculty = await ctx.db.get("faculty", id);

	if (!faculty) return null;
	if (institutionId && faculty.institutionId !== institutionId) return null;

	return faculty;
}

/**
 * **Update faculty personal info**
 */
export async function patchPersonalInfo(
	ctx: AppMutationCtx,
	faculty: Doc<"faculty">,
	body: Infer<typeof PatchPersonalInfoSchema>,
) {
	if (body.email && body.email !== faculty.email) {
		const existing = await findByEmail(ctx, faculty.institutionId, body.email);

		if (existing && existing._id !== faculty._id) {
			throwAppError(ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS);
		}
	}

	const updates: Partial<Doc<"faculty">> = {
		updatedAt: Date.now(),
	};

	if (body.firstName !== undefined) updates.firstName = body.firstName.trim();
	if (body.lastName !== undefined) updates.lastName = body.lastName.trim();
	if (body.dateOfBirth !== undefined) updates.dateOfBirth = body.dateOfBirth;
	if (body.email !== undefined) updates.email = body.email.trim();

	if (body.image !== undefined) {
		const nextImage = body.image === null ? undefined : body.image;

		if (faculty.image && faculty.image !== nextImage) {
			await deleteStoredImage(ctx, faculty.image);
		}

		updates.image = nextImage;
	}

	await ctx.db.patch("faculty", faculty._id, updates);
}

/**
 * **Update faculty employment details**
 */
export async function patchEmployment(
	ctx: AppMutationCtx,
	faculty: Doc<"faculty">,
	body: Infer<typeof PatchEmploymentSchema>,
) {
	if (body.staffId && body.staffId !== faculty.staffId) {
		const existing = await findByStaffId(
			ctx,
			faculty.institutionId,
			body.staffId,
		);

		if (existing && existing._id !== faculty._id) {
			throwAppError(ERROR_CODES.FACULTY.STAFF_ID_ALREADY_EXISTS);
		}
	}

	await ctx.db.patch("faculty", faculty._id, {
		...body,
		updatedAt: Date.now(),
	});
}

/**
 * **Update faculty phone number**
 */
export async function patchPhone(
	ctx: AppMutationCtx,
	faculty: Doc<"faculty">,
	body: Infer<typeof PatchPhoneSchema>,
) {
	await ctx.db.patch("faculty", faculty._id, {
		phone: { number: validateIndianPhoneNumber(body.number), verified: false },
		updatedAt: Date.now(),
	});
}

/**
 * **Set faculty status**
 */
export async function setStatus(
	ctx: AppMutationCtx,
	faculty: Doc<"faculty">,
	status: "active" | "inactive",
) {
	await ctx.db.patch("faculty", faculty._id, {
		status,
		updatedAt: Date.now(),
	});
}
