"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { FieldError } from "@instello/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { Spinner } from "@instello/ui/components/spinner";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { InlineTextField } from "@/features/students/sections/fields/inline-text-field";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import {
	formatIndianPhoneNumberForStorage,
	indianPhoneNumberInputSchema,
} from "@/lib/phone";
import { FacultyImageUploadField } from "../forms/faculty-image-upload-field";
import { uploadFacultyImage } from "../lib/upload-faculty-image";

export type FacultyFieldProps = {
	facultyId: Id<"faculty">;
	savedValue: string;
};

type InlineDateFieldProps = {
	fieldName: string;
	savedValue: string;
	validator: object;
	onSave: (value: string) => Promise<void>;
};

function InlineDateField({
	fieldName,
	savedValue,
	validator,
	onSave,
}: InlineDateFieldProps) {
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { [fieldName]: savedValue },
		validationLogic: revalidateLogic(),
		validators: {
			onChange: validator as never,
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			const fieldValue = value[fieldName as keyof typeof value];
			if (typeof fieldValue !== "string") return;

			if (fieldValue === savedValue) return;

			try {
				await onSave(fieldValue);
				form.reset({ [fieldName]: fieldValue });
			} catch (error) {
				setSubmitError(getConvexErrorMessage(error, "Failed to save"));
			}
		},
	});

	useEffect(() => {
		form.reset({ [fieldName]: savedValue });
	}, [savedValue, fieldName, form]);

	return (
		<form
			className="w-full text-left"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<form.Field name={fieldName}>
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<>
									<InputGroup>
										{isSubmitting && (
											<InputGroupAddon align="inline-start">
												<Spinner className="size-4 text-muted-foreground" />
											</InputGroupAddon>
										)}
										<InputGroupInput
											type="date"
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onBlur={() => {
												field.handleBlur();
												void form.handleSubmit();
											}}
											onKeyDown={(event) => {
												if (event.key === "Escape") {
													form.reset({ [fieldName]: savedValue });
													setSubmitError(null);
													field.handleBlur();
												}
											}}
											disabled={isSubmitting}
											aria-invalid={isInvalid}
										/>
									</InputGroup>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</>
							);
						}}
					</form.Field>
				)}
			</form.Subscribe>
			{submitError && (
				<p className="mt-1 text-xs text-destructive" role="alert">
					{submitError}
				</p>
			)}
		</form>
	);
}

function formatJoinedDate(timestamp?: number) {
	if (!timestamp) return "";
	return new Date(timestamp).toISOString().slice(0, 10);
}

export function FirstNameField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.mutations.updatePersonalInfo);

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
	const update = useInsMutation(api.faculty.mutations.updatePersonalInfo);

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
	const update = useInsMutation(api.faculty.mutations.updatePersonalInfo);

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
	const update = useInsMutation(api.faculty.mutations.updatePhoneNumber);

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
	const update = useInsMutation(api.faculty.mutations.updateEmployment);

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
	const update = useInsMutation(api.faculty.mutations.updateEmployment);

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
	const update = useInsMutation(api.faculty.mutations.updateEmployment);

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
	const update = useInsMutation(api.faculty.mutations.updateEmployment);

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

export function DateOfBirthField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.mutations.updatePersonalInfo);

	return (
		<InlineDateField
			fieldName="dateOfBirth"
			savedValue={savedValue}
			validator={v.object({
				dateOfBirth: v.pipe(
					v.string(),
					v.nonEmpty("Date of birth is required"),
				),
			})}
			onSave={async (dateOfBirth) => {
				await update({ id: facultyId, body: { dateOfBirth } });
			}}
		/>
	);
}

export function JoinedDateField({
	facultyId,
	savedTimestamp,
}: {
	facultyId: Id<"faculty">;
	savedTimestamp?: number;
}) {
	const update = useInsMutation(api.faculty.mutations.updateEmployment);
	const savedValue = formatJoinedDate(savedTimestamp);

	return (
		<InlineDateField
			fieldName="joinedDate"
			savedValue={savedValue}
			validator={v.object({
				joinedDate: v.string(),
			})}
			onSave={async (joinedDate) => {
				await update({
					id: facultyId,
					body: {
						joinedDate: joinedDate ? new Date(joinedDate).getTime() : undefined,
					},
				});
			}}
		/>
	);
}

type FacultyImageFieldProps = {
	facultyId: Id<"faculty">;
	firstName: string;
	lastName: string;
	savedImageUrl?: string;
};

export function FacultyImageField({
	facultyId,
	firstName,
	lastName,
	savedImageUrl,
}: FacultyImageFieldProps) {
	const updatePersonalInfo = useInsMutation(
		api.faculty.mutations.updatePersonalInfo,
	);
	const generateImageUploadUrl = useInsMutation(
		api.faculty.mutations.generateImageUploadUrl,
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
			const storageId = await uploadFacultyImage(
				() => generateImageUploadUrl({}),
				file,
			);
			await updatePersonalInfo({
				id: facultyId,
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
				id: facultyId,
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
			<FacultyImageUploadField
				hideLabel
				id={`faculty-image-${facultyId}`}
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
