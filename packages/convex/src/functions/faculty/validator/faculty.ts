import type { Infer } from "convex/values";
import { v } from "convex/values";
import { vv } from "@/schema";

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

export const FacultyDtoSchema = vv.object({
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
