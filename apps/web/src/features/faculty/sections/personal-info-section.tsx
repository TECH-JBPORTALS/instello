"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import { IconTrash, IconUpload } from "@tabler/icons-react";
import { revalidateLogic } from "@tanstack/react-form-nextjs";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { useAppForm } from "@/hooks/form";
import {
	getFacultyInitials,
	PatchPersonalInfoSchema,
} from "../forms/shared-form";

const PROFILE_PIC_MAX_BYTES = 5 * 1024 * 1024;

type PersonalInfoSectionProps = {
	faculty: {
		_id: Id<"faculty">;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		email: string;
		profilePicUrl?: string;
	};
	disabled?: boolean;
};

function ProfilePicField({
	id,
	value,
	firstName,
	lastName,
	disabled,
	isInvalid,
	errors,
	onChange,
	onBlur,
}: {
	id: string;
	value: string;
	firstName: string;
	lastName: string;
	disabled?: boolean;
	isInvalid: boolean;
	errors: Parameters<typeof FieldError>[0]["errors"];
	onChange: (value: string) => void;
	onBlur: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileError, setFileError] = useState<string | null>(null);

	const handleFileSelect = (file: File | undefined) => {
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setFileError("Please select an image file");
			return;
		}

		if (file.size > PROFILE_PIC_MAX_BYTES) {
			setFileError("Image must be 5MB or smaller");
			return;
		}

		setFileError(null);
		const reader = new FileReader();
		reader.onload = () => {
			onChange(reader.result as string);
			onBlur();
		};
		reader.readAsDataURL(file);
	};

	return (
		<Field data-invalid={isInvalid || !!fileError}>
			<FieldLabel htmlFor={id}>Profile photo</FieldLabel>
			<div className="flex items-center gap-3.5">
				<Avatar size="xl">
					<AvatarImage src={value === "" ? undefined : value} alt="Profile" />
					<AvatarFallback>
						{getFacultyInitials(firstName, lastName)}
					</AvatarFallback>
				</Avatar>
				{!disabled && (
					<div className="flex gap-2">
						<input
							ref={inputRef}
							id={id}
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={(e) => handleFileSelect(e.target.files?.[0])}
						/>
						{value ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									onChange("");
									onBlur();
								}}
							>
								<IconTrash />
								Remove
							</Button>
						) : (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => inputRef.current?.click()}
							>
								<IconUpload />
								Upload
							</Button>
						)}
					</div>
				)}
			</div>
			{fileError && <FieldError errors={[{ message: fileError }]} />}
			{isInvalid && !fileError && <FieldError errors={errors} />}
		</Field>
	);
}

export function PersonalInfoSection({
	faculty,
	disabled,
}: PersonalInfoSectionProps) {
	const updatePersonalInfo = useMutation(api.faculty.updatePersonalInfo);
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			firstName: faculty.firstName,
			lastName: faculty.lastName,
			dateOfBirth: faculty.dateOfBirth,
			email: faculty.email,
			profilePicUrl: faculty.profilePicUrl ?? "",
		},
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: PatchPersonalInfoSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await updatePersonalInfo({
					id: faculty._id,
					body: {
						firstName: value.firstName,
						lastName: value.lastName,
						dateOfBirth: value.dateOfBirth,
						email: value.email,
						profilePicUrl: value.profilePicUrl || undefined,
					},
				});
			} catch (submitError) {
				setError(
					submitError instanceof Error
						? submitError.message
						: "Failed to update personal info",
				);
			}
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Personal info</CardTitle>
				<CardDescription>
					Basic identity details for this faculty member.
				</CardDescription>
			</CardHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					void form.handleSubmit();
				}}
			>
				<CardContent>
					<FieldGroup>
						<form.Subscribe selector={(state) => state.values}>
							{(values) => (
								<form.Field
									name="profilePicUrl"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<ProfilePicField
												id={field.name}
												value={field.state.value}
												firstName={values.firstName}
												lastName={values.lastName}
												disabled={disabled}
												isInvalid={isInvalid}
												errors={field.state.meta.errors}
												onChange={field.handleChange}
												onBlur={field.handleBlur}
											/>
										);
									}}
								/>
							)}
						</form.Subscribe>

						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field
								name="firstName"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>First name</FieldLabel>
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={disabled}
												aria-invalid={isInvalid}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>
							<form.Field
								name="lastName"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Last name</FieldLabel>
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={disabled}
												aria-invalid={isInvalid}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>
						</div>

						<form.Field
							name="dateOfBirth"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Date of birth</FieldLabel>
										<Input
											id={field.name}
											type="date"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={disabled}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="email"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Email</FieldLabel>
										<Input
											id={field.name}
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={disabled}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>
					</FieldGroup>

					{error && <p className="mt-4 text-sm text-destructive">{error}</p>}
				</CardContent>
				{!disabled && (
					<CardFooter className="justify-end border-t">
						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<Button type="submit" disabled={isSubmitting}>
									Save changes
								</Button>
							)}
						</form.Subscribe>
					</CardFooter>
				)}
			</form>
		</Card>
	);
}
