import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/errors";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const CreateSchema = vv
	.doc("faculty")
	.pick(
		"staffId",
		"firstName",
		"lastName",
		"dateOfBirth",
		"email",
		"profilePicUrl",
		"designation",
		"joinedDate",
		"qualification",
		"specialization",
		"institutionId",
		"createdBy",
	);

export const CreateInputSchema = {
	staffId: vv.string(),
	firstName: vv.string(),
	lastName: vv.string(),
	dateOfBirth: vv.string(),
	email: vv.string(),
	profilePicUrl: vv.optional(vv.string()),
	designation: vv.string(),
	joinedDate: vv.optional(vv.number()),
	qualification: vv.string(),
	specialization: vv.string(),
	phoneNumber: vv.string(),
};

export const CreateInputObjectSchema = vv.object(CreateInputSchema);

export const PatchPersonalInfoSchema = vv.object({
	firstName: vv.optional(vv.string()),
	lastName: vv.optional(vv.string()),
	dateOfBirth: vv.optional(vv.string()),
	email: vv.optional(vv.string()),
	profilePicUrl: vv.optional(vv.string()),
});

export const PatchEmploymentSchema = vv.object({
	staffId: vv.optional(vv.string()),
	designation: vv.optional(vv.string()),
	joinedDate: vv.optional(vv.number()),
	qualification: vv.optional(vv.string()),
	specialization: vv.optional(vv.string()),
});

export const PatchPhoneSchema = vv.object({
	number: vv.string(),
});

export const FacultyDtoSchema = vv.object({
	_id: vv.id("faculty"),
	staffId: vv.string(),
	firstName: vv.string(),
	lastName: vv.string(),
	dateOfBirth: vv.string(),
	email: vv.string(),
	profilePicUrl: vv.optional(vv.string()),
	designation: vv.string(),
	joinedDate: vv.optional(vv.number()),
	qualification: vv.string(),
	specialization: vv.string(),
	phone: vv.object({
		number: vv.string(),
		verified: vv.boolean(),
	}),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export const PaginatedFacultyListSchema = vv.object({
	page: vv.array(FacultyDtoSchema),
	isDone: vv.boolean(),
	continueCursor: vv.string(),
});

export type FacultyDto = Infer<typeof FacultyDtoSchema>;

export type PaginatedFacultyList = Infer<typeof PaginatedFacultyListSchema>;

export type CreateInput = Infer<typeof CreateInputObjectSchema>;

export function toDto(faculty: Doc<"faculty">): FacultyDto {
	return {
		_id: faculty._id,
		staffId: faculty.staffId,
		firstName: faculty.firstName,
		lastName: faculty.lastName,
		dateOfBirth: faculty.dateOfBirth,
		email: faculty.email,
		profilePicUrl: faculty.profilePicUrl,
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

	return await ctx.db.insert("faculty", {
		staffId: args.staffId,
		firstName: args.firstName,
		lastName: args.lastName,
		dateOfBirth: args.dateOfBirth,
		email: args.email,
		profilePicUrl: args.profilePicUrl,
		designation: args.designation,
		joinedDate: args.joinedDate,
		qualification: args.qualification,
		specialization: args.specialization,
		institutionId: args.institutionId,
		createdBy: args.createdBy,
		phone: { number: args.phoneNumber, verified: false },
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
				.withIndex("by_institution_and_status", (q) =>
					q.eq("institutionId", institutionId).eq("status", status),
				)
		: ctx.db
				.query("faculty")
				.withIndex("by_institution", (q) =>
					q.eq("institutionId", institutionId),
				);

	const result = await query.order("desc").paginate(paginationOpts);

	return {
		page: result.page.map(toDto),
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

	await ctx.db.patch("faculty", faculty._id, {
		...body,
		updatedAt: Date.now(),
	});
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
		phone: { number: body.number, verified: false },
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
