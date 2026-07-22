import type { PaginationOptions, PaginationResult } from "convex/server";
import type { Infer } from "convex/values";
import { components } from "#_generated/api";
import type { Doc, Id } from "#_generated/dataModel";
import type { DatabaseReader } from "#_generated/server";
import { ERROR_CODES, throwAppError } from "#helpers/constants";
import { validateIndianPhoneNumber } from "#helpers/phone";
import type { AppMutationCtx, AppQueryCtx } from "#model/common.types";
import { vv } from "#schema";
import type {
	CreateInput,
	PaginatedFacultyList,
	PatchEmploymentSchema,
	PatchPersonalInfoSchema,
	PatchPhoneSchema,
} from "../validator/faculty";

export type FacultyInsRole = Doc<"faculty">["insRole"];

export {
	CreateInputSchema,
	PaginatedFacultyListSchema,
	PatchEmploymentSchema,
	PatchPersonalInfoSchema,
	PatchPhoneSchema,
} from "../validator/faculty";

export type { CreateInput, PaginatedFacultyList };

export type FacultyStatus = Doc<"faculty">["status"];

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
 * **Find faculty by linked user ID within an institution**
 * @returns null if no matching faculty exists
 */
export async function findByInstitutionAndUserId(
	ctx: { db: DatabaseReader },
	institutionId: string,
	userId: string,
) {
	return await ctx.db
		.query("faculty")
		.withIndex("by_institution_and_user_id", (q) =>
			q.eq("institutionId", institutionId).eq("userId", userId),
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
		status: "draft",
		insRole: "faculty",
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
		status?: FacultyStatus;
		paginationOpts: PaginationOptions;
	},
): Promise<PaginationResult<Doc<"faculty">>> {
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

	return result;
}

/** Get faculty or return null if no faculty found */
export async function find(db: DatabaseReader, id: Id<"faculty">) {
	const faculty = await db.get("faculty", id);

	if (!faculty) return null;

	return faculty;
}

/** Get faculty or throw an error if no faculty found */
export async function findOrThrow(db: DatabaseReader, id: Id<"faculty">) {
	const faculty = await find(db, id);

	if (!faculty) throwAppError(ERROR_CODES.FACULTY.NOT_FOUND);

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
	status: FacultyStatus,
) {
	await ctx.db.patch("faculty", faculty._id, {
		status,
		updatedAt: Date.now(),
	});
}

/**
 * **Activate faculty after they accept an institution invitation**
 */
export async function activateFromInvitation(
	ctx: AppMutationCtx,
	args: {
		institutionId: string;
		email: string;
		userId: string;
	},
) {
	const faculty = await findByEmail(ctx, args.institutionId, args.email);

	if (!faculty) return null;

	await ctx.db.patch("faculty", faculty._id, {
		status: "active",
		userId: args.userId,
		updatedAt: Date.now(),
	});

	return faculty._id;
}

/**
 * **Revert invited faculty to draft after invitation cancellation**
 */
export async function revertToDraftFromInvitationCancellation(
	ctx: AppMutationCtx,
	args: {
		institutionId: string;
		email: string;
	},
) {
	const faculty = await findByEmail(ctx, args.institutionId, args.email);

	if (faculty?.status !== "invited") return null;

	await setStatus(ctx, faculty, "draft");
	return faculty._id;
}

/**
 * **Find the designated principal faculty for an institution**
 * @returns null if no principal is designated
 */
export async function findPrincipal(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
) {
	return await ctx.db
		.query("faculty")
		.withIndex("by_institution_and_ins_role", (q) =>
			q.eq("institutionId", institutionId).eq("insRole", "principal"),
		)
		.first();
}

async function demotePrincipalFaculty(
	ctx: AppMutationCtx,
	institutionId: string,
	exceptFacultyId?: Id<"faculty">,
) {
	const principals = await ctx.db
		.query("faculty")
		.withIndex("by_institution_and_ins_role", (q) =>
			q.eq("institutionId", institutionId).eq("insRole", "principal"),
		)
		.take(10);

	const now = Date.now();

	for (const principal of principals) {
		if (exceptFacultyId && principal._id === exceptFacultyId) continue;

		await ctx.db.patch("faculty", principal._id, {
			insRole: "faculty",
			updatedAt: now,
		});
	}
}

async function demotePrincipalMemberships(
	ctx: AppMutationCtx,
	organizationId: string,
) {
	const members = await ctx.runQuery(components.betterAuth.adapter.findMany, {
		model: "institutionMember",
		paginationOpts: { numItems: 10, cursor: null },
		where: [
			{ field: "organizationId", operator: "eq", value: organizationId },
			{ field: "role", operator: "eq", value: "principal" },
		],
	});

	for (const member of members.page) {
		await ctx.runMutation(components.betterAuth.adapter.updateOne, {
			input: {
				model: "institutionMember",
				where: [{ field: "_id", value: member._id }],
				update: { role: "faculty" },
			},
		});
	}
}

async function promoteMembershipToPrincipal(
	ctx: AppMutationCtx,
	args: { organizationId: string; userId: string },
) {
	const membership = await ctx.runQuery(components.betterAuth.adapter.findOne, {
		model: "institutionMember",
		where: [
			{
				field: "organizationId",
				operator: "eq",
				value: args.organizationId,
			},
			{ field: "userId", operator: "eq", value: args.userId },
		],
	});

	if (!membership) return;

	if (membership.role === "owner") {
		throwAppError(ERROR_CODES.FACULTY.CANNOT_ASSIGN_OWNER);
	}

	if (membership.role === "principal") return;

	await ctx.runMutation(components.betterAuth.adapter.updateOne, {
		input: {
			model: "institutionMember",
			where: [{ field: "_id", value: membership._id }],
			update: { role: "principal" },
		},
	});
}

async function syncPendingInvitationRole(
	ctx: AppMutationCtx,
	args: { organizationId: string; email: string; role: FacultyInsRole },
) {
	const invitation = await ctx.runQuery(components.betterAuth.adapter.findOne, {
		model: "institutionInvitation",
		where: [
			{
				field: "organizationId",
				operator: "eq",
				value: args.organizationId,
			},
			{ field: "email", operator: "eq", value: args.email },
			{ field: "status", operator: "eq", value: "pending" },
		],
	});

	if (!invitation) return;

	await ctx.runMutation(components.betterAuth.adapter.updateOne, {
		input: {
			model: "institutionInvitation",
			where: [{ field: "_id", value: invitation._id }],
			update: { role: args.role },
		},
	});
}

/**
 * **Designate faculty as the institution principal**
 *
 * Demotes any existing principal (faculty designation + membership) to faculty,
 * then promotes the target. Works for draft, invited, and active faculty.
 */
export async function setAsPrincipal(
	ctx: AppMutationCtx,
	faculty: Doc<"faculty">,
) {
	if (faculty.status === "inactive") {
		throwAppError(ERROR_CODES.FACULTY.INACTIVE);
	}

	if (faculty.insRole === "principal") {
		return;
	}

	await demotePrincipalFaculty(ctx, faculty.institutionId, faculty._id);
	await demotePrincipalMemberships(ctx, faculty.institutionId);

	await ctx.db.patch("faculty", faculty._id, {
		insRole: "principal",
		updatedAt: Date.now(),
	});

	if (faculty.userId) {
		await promoteMembershipToPrincipal(ctx, {
			organizationId: faculty.institutionId,
			userId: faculty.userId,
		});
	}

	if (faculty.status === "invited") {
		await syncPendingInvitationRole(ctx, {
			organizationId: faculty.institutionId,
			email: faculty.email,
			role: "principal",
		});
	}
}
