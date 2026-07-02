"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import * as v from "valibot";
import { InlineTextField } from "@/features/students/sections/fields/inline-text-field";
import { useInsMutation } from "@/hooks/convex-react";
import {
	formatIndianPhoneNumberForStorage,
	indianPhoneNumberInputSchema,
} from "@/lib/phone";
import type { FacultyFieldProps } from "./faculty-date-field";

export function FirstNameField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updatePersonalInfo);

	return (
		<InlineTextField
			fieldName="firstName"
			savedValue={savedValue}
			validator={v.object({
				firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
			})}
			onSave={async (firstName) => {
				await update({ id: facultyId, body: { firstName } });
			}}
		/>
	);
}

export function LastNameField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updatePersonalInfo);

	return (
		<InlineTextField
			fieldName="lastName"
			savedValue={savedValue}
			validator={v.object({
				lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
			})}
			onSave={async (lastName) => {
				await update({ id: facultyId, body: { lastName } });
			}}
		/>
	);
}

export function EmailField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updatePersonalInfo);

	return (
		<InlineTextField
			fieldName="email"
			savedValue={savedValue}
			validator={v.object({
				email: v.pipe(v.string(), v.email("Invalid email address")),
			})}
			onSave={async (email) => {
				await update({ id: facultyId, body: { email } });
			}}
		/>
	);
}

export function PhoneField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updatePhoneNumber);

	return (
		<InlineTextField
			fieldName="number"
			savedValue={savedValue}
			validator={v.object({
				number: indianPhoneNumberInputSchema,
			})}
			onSave={async (number) => {
				await update({
					id: facultyId,
					body: {
						number: formatIndianPhoneNumberForStorage(number),
					},
				});
			}}
		/>
	);
}

export function StaffIdField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updateEmployment);

	return (
		<InlineTextField
			fieldName="staffId"
			savedValue={savedValue}
			validator={v.object({
				staffId: v.pipe(v.string(), v.nonEmpty("Staff ID is required")),
			})}
			onSave={async (staffId) => {
				await update({ id: facultyId, body: { staffId } });
			}}
		/>
	);
}

export function DesignationField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updateEmployment);

	return (
		<InlineTextField
			fieldName="designation"
			savedValue={savedValue}
			validator={v.object({
				designation: v.pipe(v.string(), v.nonEmpty("Designation is required")),
			})}
			onSave={async (designation) => {
				await update({ id: facultyId, body: { designation } });
			}}
		/>
	);
}

export function QualificationField({
	facultyId,
	savedValue,
}: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updateEmployment);

	return (
		<InlineTextField
			fieldName="qualification"
			savedValue={savedValue}
			validator={v.object({
				qualification: v.pipe(
					v.string(),
					v.nonEmpty("Qualification is required"),
				),
			})}
			onSave={async (qualification) => {
				await update({ id: facultyId, body: { qualification } });
			}}
		/>
	);
}

export function SpecializationField({
	facultyId,
	savedValue,
}: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updateEmployment);

	return (
		<InlineTextField
			fieldName="specialization"
			savedValue={savedValue}
			validator={v.object({
				specialization: v.pipe(
					v.string(),
					v.nonEmpty("Specialization is required"),
				),
			})}
			onSave={async (specialization) => {
				await update({ id: facultyId, body: { specialization } });
			}}
		/>
	);
}

export type FacultySettingsProps = {
	faculty: {
		_id: Id<"faculty">;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		email: string;
		image?: string;
		staffId: string;
		designation: string;
		qualification: string;
		specialization: string;
		joinedDate?: number;
		phone: {
			number: string;
			verified: boolean;
		};
	};
};
