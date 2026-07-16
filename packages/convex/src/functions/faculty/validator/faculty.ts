import { paginationResultValidator } from "convex/server";
import type { Infer } from "convex/values";
import { v } from "convex/values";
import { vv } from "#schema";

export const CreateInputSchema = {
	staffId: vv.string(),
	firstName: vv.string(),
	lastName: vv.string(),
	dateOfBirth: vv.string(),
	email: vv.string(),
	image: v.optional(v.id("_storage")),
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
	image: v.optional(v.union(v.id("_storage"), v.null())),
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

export const FacultyResultSchema = vv.object({
	_id: vv.id("faculty"),
	staffId: vv.string(),
	firstName: vv.string(),
	lastName: vv.string(),
	dateOfBirth: vv.string(),
	email: vv.string(),
	image: vv.optional(vv.string()),
	designation: vv.string(),
	joinedDate: vv.optional(vv.number()),
	qualification: vv.string(),
	specialization: vv.string(),
	phone: vv.object({
		number: vv.string(),
		verified: vv.boolean(),
	}),
	/**
	 * Status field can be one of the following values:
	 * - `active`   The faculty is active and can access the institution.
	 * - `inactive` The faculty is inactive and cannot access the institution.
	 * - `draft`    The faculty is a draft and is not yet active.
	 * - `invited`  The faculty is invited to join the institution but has not yet accepted the invitation.
	 */
	status: vv.union(
		vv.literal("active"),
		vv.literal("inactive"),
		vv.literal("draft"),
		vv.literal("invited"),
	),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export const PaginatedFacultyListSchema =
	paginationResultValidator(FacultyResultSchema);

export type FacultyResult = Infer<typeof FacultyResultSchema>;
export type PaginatedFacultyList = Infer<typeof PaginatedFacultyListSchema>;
export type CreateInput = Infer<typeof CreateInputObjectSchema>;
