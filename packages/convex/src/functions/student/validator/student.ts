import type { Infer } from "convex/values";
import { v } from "convex/values";
import { vv } from "#schema";

const GenderSchema = vv.union(
	vv.literal("male"),
	vv.literal("female"),
	vv.literal("others"),
);

export const CreateInputSchema = {
	classId: vv.id("classes"),
	firstName: vv.string(),
	lastName: vv.string(),
	usn: vv.string(),
	email: vv.string(),
	gender: GenderSchema,
	categoryId: vv.id("institutionStudentCategories"),
	phoneNumber: vv.string(),
	apaarId: vv.optional(vv.string()),
	batchId: vv.optional(vv.id("classBatches")),
	image: v.optional(v.id("_storage")),
	fatherName: vv.optional(vv.string()),
	fatherPhoneNumber: vv.optional(vv.string()),
	motherName: vv.optional(vv.string()),
	motherPhoneNumber: vv.optional(vv.string()),
	addressLine: vv.optional(vv.string()),
	city: vv.optional(vv.string()),
	state: vv.optional(vv.string()),
	postalCode: vv.optional(vv.string()),
};

export const CreateInputObjectSchema = vv.object(CreateInputSchema);

export const PatchPersonalInfoSchema = vv.object({
	firstName: vv.optional(vv.string()),
	lastName: vv.optional(vv.string()),
	gender: vv.optional(GenderSchema),
	image: v.optional(v.union(v.id("_storage"), v.null())),
});

export const PatchContactInfoSchema = vv.object({
	email: vv.optional(vv.string()),
	phoneNumber: vv.optional(vv.string()),
});

export const PatchAcademicInfoSchema = vv.object({
	usn: vv.optional(vv.string()),
	categoryId: vv.optional(vv.id("institutionStudentCategories")),
	apaarId: vv.optional(vv.string()),
});

export const PatchFamilyInfoSchema = vv.object({
	fatherName: vv.optional(vv.string()),
	fatherPhoneNumber: vv.optional(vv.string()),
	motherName: vv.optional(vv.string()),
	motherPhoneNumber: vv.optional(vv.string()),
	addressLine: vv.optional(vv.string()),
	city: vv.optional(vv.string()),
	state: vv.optional(vv.string()),
	postalCode: vv.optional(vv.string()),
});

export const StudentDtoSchema = vv.object({
	_id: vv.id("students"),
	classId: vv.id("classes"),
	firstName: vv.string(),
	lastName: vv.string(),
	usn: vv.string(),
	email: vv.string(),
	gender: GenderSchema,
	categoryId: vv.id("institutionStudentCategories"),
	categoryName: vv.string(),
	phoneNumber: vv.string(),
	apaarId: vv.optional(vv.string()),
	batchId: vv.optional(vv.id("classBatches")),
	batchLabel: vv.optional(vv.string()),
	image: vv.optional(vv.string()),
	fatherName: vv.optional(vv.string()),
	fatherPhoneNumber: vv.optional(vv.string()),
	motherName: vv.optional(vv.string()),
	motherPhoneNumber: vv.optional(vv.string()),
	addressLine: vv.optional(vv.string()),
	city: vv.optional(vv.string()),
	state: vv.optional(vv.string()),
	postalCode: vv.optional(vv.string()),
	country: vv.optional(vv.string()),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export const PaginatedStudentListSchema = vv.object({
	page: vv.array(StudentDtoSchema),
	isDone: vv.boolean(),
	continueCursor: vv.string(),
});

export type StudentDto = Infer<typeof StudentDtoSchema>;
export type PaginatedStudentList = Infer<typeof PaginatedStudentListSchema>;
export type CreateInput = Infer<typeof CreateInputObjectSchema>;
