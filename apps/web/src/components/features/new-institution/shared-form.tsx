import { formOptions } from "@tanstack/react-form-nextjs";
import * as v from "valibot";

export const INDIAN_STATES = [
	"Andhra Pradesh",
	"Arunachal Pradesh",
	"Assam",
	"Bihar",
	"Chhattisgarh",
	"Goa",
	"Gujarat",
	"Haryana",
	"Himachal Pradesh",
	"Jharkhand",
	"Karnataka",
	"Kerala",
	"Madhya Pradesh",
	"Maharashtra",
	"Manipur",
	"Meghalaya",
	"Mizoram",
	"Nagaland",
	"Odisha",
	"Punjab",
	"Rajasthan",
	"Sikkim",
	"Tamil Nadu",
	"Telangana",
	"Tripura",
	"Uttar Pradesh",
	"Uttarakhand",
	"West Bengal",
	"Andaman and Nicobar Islands",
	"Chandigarh",
	"Dadra and Nagar Haveli and Daman and Diu",
	"Delhi",
	"Jammu and Kashmir",
	"Ladakh",
	"Lakshadweep",
	"Puducherry",
] as const;

export const SlugSchema = v.pipe(
	v.string(),
	v.slug("Invalid slug. slug is combination of letters and numbers"),
	v.nonEmpty("Slug is required"),
);

export const CodeSchema = v.pipe(v.string(), v.nonEmpty("Code is required"));

export const BasicInfoSchema = v.object({
	logo: v.pipe(v.string()),
	name: v.pipe(v.string(), v.nonEmpty("Name is required")),
	code: CodeSchema,
	slug: SlugSchema,
});

export const AddressSchema = v.object({
	addressLine: v.pipe(v.string(), v.nonEmpty("Address is required")),
	district: v.pipe(v.string(), v.nonEmpty("District should be mentioned")),
	state: v.pipe(v.string(), v.nonEmpty("State should be selected")),
	zipCode: v.pipe(
		v.string(),
		v.nonEmpty("Zip code is required"),
		v.minLength(6, "Invalid zip code"),
		v.maxLength(6, "Invalid zip code"),
	),
});

export const newInstitutionFormOpt = formOptions({
	defaultValues: {
		basicInfo: {
			logo: "",
			name: "",
			code: "",
			slug: "",
		},
		address: {
			addressLine: "",
			district: "",
			state: "",
			zipCode: "",
		},
	},
});
