import { formOptions } from "@tanstack/react-form-nextjs";
import * as v from "valibot";

export const PersonalInfoSchema = v.object({
	firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
	lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
	dateOfBirth: v.pipe(v.string(), v.nonEmpty("Date of birth is required")),
	email: v.pipe(v.string(), v.email("Invalid email address")),
	profilePicUrl: v.pipe(v.string()),
});

export const EmploymentSchema = v.object({
	staffId: v.pipe(v.string(), v.nonEmpty("Staff ID is required")),
	designation: v.pipe(v.string(), v.nonEmpty("Designation is required")),
	qualification: v.pipe(v.string(), v.nonEmpty("Qualification is required")),
	specialization: v.pipe(v.string(), v.nonEmpty("Specialization is required")),
	joinedDate: v.pipe(v.string()),
});

export const PatchEmploymentSchema = v.object({
	staffId: v.pipe(v.string(), v.nonEmpty("Staff ID is required")),
	designation: v.pipe(v.string(), v.nonEmpty("Designation is required")),
	qualification: v.pipe(v.string(), v.nonEmpty("Qualification is required")),
	specialization: v.pipe(v.string(), v.nonEmpty("Specialization is required")),
	joinedDate: v.pipe(v.string()),
});

export const FacultyAddressSchema = v.object({
	addressLine: v.pipe(v.string(), v.nonEmpty("Address is required")),
	district: v.pipe(v.string(), v.nonEmpty("District is required")),
	state: v.pipe(v.string(), v.nonEmpty("State is required")),
	country: v.pipe(v.string(), v.nonEmpty("Country is required")),
	zipCode: v.pipe(
		v.string(),
		v.nonEmpty("Zip code is required"),
		v.minLength(6, "Invalid zip code"),
		v.maxLength(6, "Invalid zip code"),
	),
});

export const ContactSchema = v.object({
	phoneNumber: v.pipe(v.string(), v.nonEmpty("Phone number is required")),
});

export const PatchPersonalInfoSchema = v.object({
	firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
	lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
	dateOfBirth: v.pipe(v.string(), v.nonEmpty("Date of birth is required")),
	email: v.pipe(v.string(), v.email("Invalid email address")),
	profilePicUrl: v.pipe(v.string()),
});

export const PatchAddressSchema = FacultyAddressSchema;

export const PatchPhoneSchema = v.object({
	number: v.pipe(v.string(), v.nonEmpty("Phone number is required")),
});

export const addFacultyFormOpt = formOptions({
	defaultValues: {
		personalInfo: {
			firstName: "",
			lastName: "",
			dateOfBirth: "",
			email: "",
			profilePicUrl: "",
		},
		employment: {
			staffId: "",
			designation: "",
			qualification: "",
			specialization: "",
			joinedDate: "",
		},
		address: {
			addressLine: "",
			district: "",
			state: "",
			country: "India",
			zipCode: "",
		},
		contact: {
			phoneNumber: "",
		},
	},
});

export function getFacultyDisplayName(firstName: string, lastName: string) {
	return `${firstName} ${lastName}`.trim();
}

export function getFacultyInitials(firstName: string, lastName: string) {
	const first = firstName.charAt(0).toUpperCase();
	const last = lastName.charAt(0).toUpperCase();
	return `${first}${last}` || "?";
}
