"use client";

import { api } from "@instello/convex/api";
import * as v from "valibot";
import { useInsMutation } from "@/hooks/convex-react";
import {
	formatIndianPhoneNumberForStorage,
	indianPhoneNumberInputSchema,
} from "@/lib/phone";
import { InlineTextField, type StudentFieldProps } from "./inline-text-field";

export function FirstNameField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.students.updatePersonalInfo);

	return (
		<InlineTextField
			fieldName="firstName"
			savedValue={savedValue}
			validator={v.object({
				firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
			})}
			onSave={async (firstName) => {
				await update({ id: studentId, body: { firstName } });
			}}
		/>
	);
}

export function LastNameField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.students.updatePersonalInfo);

	return (
		<InlineTextField
			fieldName="lastName"
			savedValue={savedValue}
			validator={v.object({
				lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
			})}
			onSave={async (lastName) => {
				await update({ id: studentId, body: { lastName } });
			}}
		/>
	);
}

export function UsnField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.students.updateAcademicInfo);

	return (
		<InlineTextField
			fieldName="usn"
			savedValue={savedValue}
			validator={v.object({
				usn: v.pipe(v.string(), v.nonEmpty("USN is required")),
			})}
			onSave={async (usn) => {
				await update({ id: studentId, body: { usn } });
			}}
		/>
	);
}

export function EmailField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.students.updateContactInfo);

	return (
		<InlineTextField
			fieldName="email"
			savedValue={savedValue}
			validator={v.object({
				email: v.pipe(v.string(), v.email("Invalid email address")),
			})}
			onSave={async (email) => {
				await update({ id: studentId, body: { email } });
			}}
		/>
	);
}

export function PhoneField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.students.updateContactInfo);

	return (
		<InlineTextField
			fieldName="phoneNumber"
			savedValue={savedValue}
			validator={v.object({
				phoneNumber: indianPhoneNumberInputSchema,
			})}
			onSave={async (phoneNumber) => {
				await update({
					id: studentId,
					body: {
						phoneNumber: formatIndianPhoneNumberForStorage(phoneNumber),
					},
				});
			}}
		/>
	);
}

export function ApaarIdField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.students.updateAcademicInfo);

	return (
		<InlineTextField
			fieldName="apaarId"
			savedValue={savedValue}
			validator={v.object({
				apaarId: v.pipe(
					v.string(),
					v.check(
						(value) => value === "" || /^\d{12}$/.test(value),
						"APAAR ID must be exactly 12 digits",
					),
				),
			})}
			placeholder="12-digit code"
			onSave={async (apaarId) => {
				await update({
					id: studentId,
					body: { apaarId: apaarId || undefined },
				});
			}}
		/>
	);
}
