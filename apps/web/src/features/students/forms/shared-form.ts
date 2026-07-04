import { formOptions } from "@tanstack/react-form-nextjs";
import * as v from "valibot";
import {
	indianPhoneNumberInputSchema,
	optionalIndianPhoneNumberInputSchema,
} from "@/lib/phone";
import { GENDER_OPTIONS } from "../constants";

const GenderSchema = v.picklist(GENDER_OPTIONS, "Select a valid gender");

const ApaarIdSchema = v.pipe(
	v.string(),
	v.check(
		(value) => value === "" || /^\d{12}$/.test(value),
		"APAAR ID must be exactly 12 digits",
	),
);

export const PersonalInfoSchema = v.object({
	imageFile: v.nullable(v.instance(File)),
	firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
	lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
	gender: GenderSchema,
});

export const ContactSchema = v.object({
	email: v.pipe(v.string(), v.email("Invalid email address")),
	phoneNumber: indianPhoneNumberInputSchema,
});

export const AcademicSchema = v.object({
	usn: v.pipe(v.string(), v.nonEmpty("USN is required")),
	categoryId: v.pipe(v.string(), v.nonEmpty("Category is required")),
	apaarId: ApaarIdSchema,
	batchId: v.string(),
});

export function buildAcademicSchema(isGroupsEnabled: boolean) {
	return v.object({
		usn: v.pipe(v.string(), v.nonEmpty("USN is required")),
		categoryId: v.pipe(v.string(), v.nonEmpty("Category is required")),
		apaarId: ApaarIdSchema,
		batchId: isGroupsEnabled
			? v.pipe(v.string(), v.nonEmpty("Batch is required"))
			: v.string(),
	});
}

export const FamilySchema = v.object({
	fatherName: v.string(),
	fatherPhoneNumber: optionalIndianPhoneNumberInputSchema,
	motherName: v.string(),
	motherPhoneNumber: optionalIndianPhoneNumberInputSchema,
	addressLine: v.string(),
	city: v.string(),
	state: v.string(),
	postalCode: v.string(),
});

export const CreateStudentSchema = v.object({
	personalInfo: PersonalInfoSchema,
	contact: ContactSchema,
	family: FamilySchema,
	academic: AcademicSchema,
});

export function buildCreateStudentSchema(isGroupsEnabled: boolean) {
	return v.object({
		personalInfo: PersonalInfoSchema,
		contact: ContactSchema,
		family: FamilySchema,
		academic: buildAcademicSchema(isGroupsEnabled),
	});
}

export const addStudentFormOpt = formOptions({
	defaultValues: {
		personalInfo: {
			imageFile: null as File | null,
			firstName: "",
			lastName: "",
			gender: "male" as (typeof GENDER_OPTIONS)[number],
		},
		academic: {
			usn: "",
			categoryId: "",
			apaarId: "",
			batchId: "",
		},

		contact: {
			email: "",
			phoneNumber: "",
		},
		family: {
			fatherName: "",
			fatherPhoneNumber: "",
			motherName: "",
			motherPhoneNumber: "",
			addressLine: "",
			city: "",
			state: "",
			postalCode: "",
		},
	},
});

export function getStudentDisplayName(firstName: string, lastName: string) {
	return `${firstName} ${lastName}`.trim();
}

export function getStudentInitials(firstName: string, lastName: string) {
	const first = firstName.charAt(0).toUpperCase();
	const last = lastName.charAt(0).toUpperCase();
	return `${first}${last}` || "?";
}
