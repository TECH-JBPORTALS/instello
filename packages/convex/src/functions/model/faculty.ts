import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES } from "../helpers/errors";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const CreateSchema = vv
	.doc("faculty")
	.pick(
		"firstName",
		"lastName",
		"dateOfBirth",
		"email",
		"profilePicUrl",
		"addressLine",
		"district",
		"state",
		"country",
		"zipCode",
		"institutionId",
		"createdBy",
	);

export const CreateInputSchema = {
	firstName: vv.string(),
	lastName: vv.string(),
	dateOfBirth: vv.string(),
	email: vv.string(),
	profilePicUrl: vv.optional(vv.string()),
	addressLine: vv.string(),
	district: vv.string(),
	state: vv.string(),
	country: vv.string(),
	zipCode: vv.string(),
	phoneNumber: vv.string(),
};

export const PatchPersonalInfoSchema = vv.object({
	firstName: vv.optional(vv.string()),
	lastName: vv.optional(vv.string()),
	dateOfBirth: vv.optional(vv.string()),
	email: vv.optional(vv.string()),
	profilePicUrl: vv.optional(vv.string()),
});

export const PatchAddressSchema = vv.object({
	addressLine: vv.optional(vv.string()),
	district: vv.optional(vv.string()),
	state: vv.optional(vv.string()),
	country: vv.optional(vv.string()),
	zipCode: vv.optional(vv.string()),
});

export const PatchPhoneSchema = vv.object({
	number: vv.string(),
});

export const FacultyDtoSchema = vv.object({
	_id: vv.id("faculty"),
	firstName: vv.string(),
	lastName: vv.string(),
	dateOfBirth: vv.string(),
	email: vv.string(),
	profilePicUrl: vv.optional(vv.string()),
	addressLine: vv.string(),
	district: vv.string(),
	state: vv.string(),
	country: vv.string(),
	zipCode: vv.string(),
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

export function toDto(faculty: Doc<"faculty">): FacultyDto {
	return {
		_id: faculty._id,
		firstName: faculty.firstName,
		lastName: faculty.lastName,
		dateOfBirth: faculty.dateOfBirth,
		email: faculty.email,
		profilePicUrl: faculty.profilePicUrl,
		addressLine: faculty.addressLine,
		district: faculty.district,
		state: faculty.state,
		country: faculty.country,
		zipCode: faculty.zipCode,
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
 * **Create faculty**
 * @returns faculty id
 */
export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof CreateSchema> & { phoneNumber: string },
) {
	const existing = await findByEmail(ctx, args.institutionId, args.email);

	if (existing) {
		throw new ConvexError(ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS.message);
	}

	const now = Date.now();

	return await ctx.db.insert("faculty", {
		firstName: args.firstName,
		lastName: args.lastName,
		dateOfBirth: args.dateOfBirth,
		email: args.email,
		profilePicUrl: args.profilePicUrl,
		addressLine: args.addressLine,
		district: args.district,
		state: args.state,
		country: args.country,
		zipCode: args.zipCode,
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
 * @returns null if faculty does not exist
 */
export async function getById(ctx: AppQueryCtx, id: Id<"faculty">) {
	return await ctx.db.get("faculty", id);
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
			throw new ConvexError(ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS.message);
		}
	}

	await ctx.db.patch("faculty", faculty._id, {
		...body,
		updatedAt: Date.now(),
	});
}

/**
 * **Update faculty address**
 */
export async function patchAddress(
	ctx: AppMutationCtx,
	faculty: Doc<"faculty">,
	body: Infer<typeof PatchAddressSchema>,
) {
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
