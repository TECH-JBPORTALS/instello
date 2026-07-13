"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { FieldError } from "@instello/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Spinner } from "@instello/ui/components/spinner";
import { useEffect, useState } from "react";
import * as v from "valibot";
import {
	InlineFormField,
	type InlineFormFieldRenderProps,
} from "@/components/common/inline-form-field";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { INDIAN_STATES } from "@/lib/indian-states";
import {
	formatIndianPhoneNumberForStorage,
	indianPhoneNumberInputSchema,
	optionalIndianPhoneNumberInputSchema,
} from "@/lib/phone";
import { GENDER_LABELS, GENDER_OPTIONS, type GenderOption } from "../constants";
import { StudentImageUploadField } from "../forms/student-image-upload-field";
import { uploadStudentImage } from "../lib/upload-student-image";

export type StudentFieldProps = {
	studentId: Id<"students">;
	savedValue: string;
};

function renderTextControl(
	field: InlineFormFieldRenderProps<string>,
	options?: { placeholder?: string },
) {
	return (
		<>
			<InputGroup className="min-w-3xs">
				{field.isSubmitting && (
					<InputGroupAddon align="inline-start">
						<Spinner className="size-4 text-muted-foreground" />
					</InputGroupAddon>
				)}
				<InputGroupInput
					value={field.value}
					onChange={(event) => field.onChange(event.target.value)}
					onBlur={field.onBlur}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							field.onEscape();
						}
					}}
					disabled={field.isSubmitting}
					placeholder={options?.placeholder}
					aria-invalid={field.isInvalid}
				/>
			</InputGroup>
			{field.isInvalid && <FieldError errors={field.errors} />}
		</>
	);
}

export function FirstNameField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updatePersonalInfo);

	return (
		<InlineFormField
			fieldName="firstName"
			savedValue={savedValue}
			validator={v.object({
				firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
			})}
			onSave={async (firstName) => {
				await update({ id: studentId, body: { firstName } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function LastNameField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updatePersonalInfo);

	return (
		<InlineFormField
			fieldName="lastName"
			savedValue={savedValue}
			validator={v.object({
				lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
			})}
			onSave={async (lastName) => {
				await update({ id: studentId, body: { lastName } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function UsnField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateAcademicInfo);

	return (
		<InlineFormField
			fieldName="usn"
			savedValue={savedValue}
			validator={v.object({
				usn: v.pipe(v.string(), v.nonEmpty("USN is required")),
			})}
			onSave={async (usn) => {
				await update({ id: studentId, body: { usn } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function EmailField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateContactInfo);

	return (
		<InlineFormField
			fieldName="email"
			savedValue={savedValue}
			validator={v.object({
				email: v.pipe(v.string(), v.email("Invalid email address")),
			})}
			onSave={async (email) => {
				await update({ id: studentId, body: { email } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function PhoneField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateContactInfo);

	return (
		<InlineFormField
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
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function ApaarIdField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateAcademicInfo);

	return (
		<InlineFormField
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
			onSave={async (apaarId) => {
				await update({
					id: studentId,
					body: { apaarId: apaarId || undefined },
				});
			}}
		>
			{(field) => renderTextControl(field, { placeholder: "12-digit code" })}
		</InlineFormField>
	);
}

export function FatherNameField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="fatherName"
			savedValue={savedValue}
			onSave={async (fatherName) => {
				await update({
					id: studentId,
					body: { fatherName: fatherName || undefined },
				});
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function FatherPhoneField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="fatherPhoneNumber"
			savedValue={savedValue}
			validator={v.object({
				fatherPhoneNumber: optionalIndianPhoneNumberInputSchema,
			})}
			onSave={async (fatherPhoneNumber) => {
				await update({
					id: studentId,
					body: {
						fatherPhoneNumber: fatherPhoneNumber
							? formatIndianPhoneNumberForStorage(fatherPhoneNumber)
							: undefined,
					},
				});
			}}
		>
			{(field) => renderTextControl(field, { placeholder: "+91 98765 43210" })}
		</InlineFormField>
	);
}

export function MotherNameField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="motherName"
			savedValue={savedValue}
			onSave={async (motherName) => {
				await update({
					id: studentId,
					body: { motherName: motherName || undefined },
				});
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function MotherPhoneField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="motherPhoneNumber"
			savedValue={savedValue}
			validator={v.object({
				motherPhoneNumber: optionalIndianPhoneNumberInputSchema,
			})}
			onSave={async (motherPhoneNumber) => {
				await update({
					id: studentId,
					body: {
						motherPhoneNumber: motherPhoneNumber
							? formatIndianPhoneNumberForStorage(motherPhoneNumber)
							: undefined,
					},
				});
			}}
		>
			{(field) => renderTextControl(field, { placeholder: "+91 98765 43210" })}
		</InlineFormField>
	);
}

export function AddressLineField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="addressLine"
			savedValue={savedValue}
			onSave={async (addressLine) => {
				await update({
					id: studentId,
					body: { addressLine: addressLine || undefined },
				});
			}}
		>
			{(field) =>
				renderTextControl(field, {
					placeholder: "Building, street, landmark",
				})
			}
		</InlineFormField>
	);
}

export function CityField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="city"
			savedValue={savedValue}
			onSave={async (city) => {
				await update({
					id: studentId,
					body: { city: city || undefined },
				});
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function PostalCodeField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="postalCode"
			savedValue={savedValue}
			onSave={async (postalCode) => {
				await update({
					id: studentId,
					body: { postalCode: postalCode || undefined },
				});
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function GenderField({
	studentId,
	savedValue,
}: {
	studentId: Id<"students">;
	savedValue: GenderOption;
}) {
	const update = useInsMutation(api.student.mutations.updatePersonalInfo);

	return (
		<InlineFormField
			fieldName="gender"
			savedValue={savedValue}
			onSave={async (gender) => {
				await update({ id: studentId, body: { gender } });
			}}
		>
			{(field) => (
				<div className="flex items-center gap-2">
					{field.isSubmitting && (
						<Spinner className="size-4 shrink-0 text-muted-foreground" />
					)}
					<Select
						value={field.value}
						disabled={field.isSubmitting}
						onValueChange={(next) => {
							if (!next) return;
							field.onChange(next as GenderOption);
							field.submit();
						}}
					>
						<SelectTrigger className="h-8 w-auto min-w-3xs bg-transparent shadow-none hover:bg-accent/50">
							<SelectValue className="capitalize" />
						</SelectTrigger>
						<SelectContent align="center">
							{GENDER_OPTIONS.map((option) => (
								<SelectItem key={option} value={option}>
									{GENDER_LABELS[option]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
		</InlineFormField>
	);
}

export function CategoryField({
	studentId,
	savedValue,
}: {
	studentId: Id<"students">;
	savedValue: Id<"institutionStudentCategories">;
}) {
	const update = useInsMutation(api.student.mutations.updateAcademicInfo);
	const categories = useInsQuery(api.student.queries.listCategories, {});

	return (
		<InlineFormField
			fieldName="categoryId"
			savedValue={savedValue}
			onSave={async (categoryId) => {
				await update({ id: studentId, body: { categoryId } });
			}}
		>
			{(field) => (
				<div className="flex items-center gap-2">
					{field.isSubmitting && (
						<Spinner className="size-4 shrink-0 text-muted-foreground" />
					)}
					<Select
						value={field.value}
						disabled={field.isSubmitting}
						onValueChange={(next) => {
							if (!next) return;
							field.onChange(next as Id<"institutionStudentCategories">);
							field.submit();
						}}
					>
						<SelectTrigger className="h-8 w-auto min-w-3xs bg-transparent shadow-none hover:bg-accent/50">
							<SelectValue>
								{(categories ?? []).find(
									(category) => category._id === field.value,
								)?.name || "Select category"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent align="center">
							{(categories ?? []).map((category) => (
								<SelectItem key={category._id} value={category._id}>
									{category.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
		</InlineFormField>
	);
}

export function StateField({ studentId, savedValue }: StudentFieldProps) {
	const update = useInsMutation(api.student.mutations.updateFamilyInfo);

	return (
		<InlineFormField
			fieldName="state"
			savedValue={savedValue}
			onSave={async (state) => {
				await update({
					id: studentId,
					body: { state: state || undefined },
				});
			}}
		>
			{(field) => (
				<div className="flex items-center gap-2">
					{field.isSubmitting && (
						<Spinner className="size-4 shrink-0 text-muted-foreground" />
					)}
					<Select
						value={field.value}
						disabled={field.isSubmitting}
						onValueChange={(next) => {
							if (!next) return;
							field.onChange(next);
							field.submit();
						}}
					>
						<SelectTrigger className="h-8 w-auto min-w-3xs bg-transparent shadow-none hover:bg-accent/50">
							<SelectValue>{field.value || "Select state"}</SelectValue>
						</SelectTrigger>
						<SelectContent align="center">
							{INDIAN_STATES.map((state) => (
								<SelectItem key={state} value={state}>
									{state}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
		</InlineFormField>
	);
}

type StudentImageFieldProps = {
	studentId: Id<"students">;
	firstName: string;
	lastName: string;
	savedImageUrl?: string;
};

export function StudentImageField({
	studentId,
	firstName,
	lastName,
	savedImageUrl,
}: StudentImageFieldProps) {
	const updatePersonalInfo = useInsMutation(
		api.student.mutations.updatePersonalInfo,
	);
	const generateImageUploadUrl = useInsMutation(
		api.student.mutations.generateImageUploadUrl,
	);
	const [previewUrl, setPreviewUrl] = useState<string | undefined>(
		savedImageUrl,
	);
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		setPreviewUrl(savedImageUrl);
	}, [savedImageUrl]);

	const handleFileSelect = async (file: File) => {
		setError(null);
		setIsUploading(true);

		try {
			const storageId = await uploadStudentImage(
				() => generateImageUploadUrl({}),
				file,
			);
			await updatePersonalInfo({
				id: studentId,
				body: { image: storageId },
			});
			setPreviewUrl(URL.createObjectURL(file));
		} catch (uploadError) {
			setError(getConvexErrorMessage(uploadError, "Failed to upload image"));
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemove = async () => {
		setError(null);
		setIsUploading(true);

		try {
			await updatePersonalInfo({
				id: studentId,
				body: { image: null },
			});
			setPreviewUrl(undefined);
		} catch (removeError) {
			setError(getConvexErrorMessage(removeError, "Failed to remove image"));
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="mt-3 space-y-2">
			<StudentImageUploadField
				hideLabel
				id={`student-image-${studentId}`}
				firstName={firstName}
				lastName={lastName}
				previewUrl={previewUrl}
				onFileSelect={(file) => {
					void handleFileSelect(file);
				}}
				onRemove={() => {
					void handleRemove();
				}}
			/>
			{isUploading && (
				<p className="text-xs text-muted-foreground">Uploading…</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}

export type StudentSettingsProps = {
	student: {
		_id: Id<"students">;
		firstName: string;
		lastName: string;
		usn: string;
		email: string;
		gender: GenderOption;
		categoryId: Id<"institutionStudentCategories">;
		phoneNumber: string;
		apaarId?: string;
		image?: string;
		fatherName?: string;
		fatherPhoneNumber?: string;
		motherName?: string;
		motherPhoneNumber?: string;
		addressLine?: string;
		city?: string;
		state?: string;
		postalCode?: string;
	};
};
