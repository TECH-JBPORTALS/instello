"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import { IconTrash, IconUpload } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { withForm } from "@/hooks/form";
import {
	addFacultyFormOpt,
	getFacultyInitials,
	PersonalInfoSchema,
} from "./shared-form";

const PROFILE_PIC_MAX_BYTES = 5 * 1024 * 1024;

function ProfilePicUploadField({
	id,
	value,
	firstName,
	lastName,
	isInvalid,
	errors,
	onChange,
	onBlur,
}: {
	id: string;
	value: string;
	firstName: string;
	lastName: string;
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
					<AvatarImage
						src={value === "" ? undefined : value}
						alt="Profile photo"
					/>
					<AvatarFallback>
						{getFacultyInitials(firstName, lastName)}
					</AvatarFallback>
				</Avatar>
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
			</div>
			{fileError && <FieldError errors={[{ message: fileError }]} />}
			{isInvalid && !fileError && <FieldError errors={errors} />}
			<FieldDescription>
				Optional. Recommended size 256x256px (max 5mb)
			</FieldDescription>
		</Field>
	);
}

export const PersonalInfoStep = withForm({
	...addFacultyFormOpt,
	props: {
		step: 0,
		setStep: (_step: number) => {},
	},
	render: function Render({ form, step, setStep }) {
		return (
			<form.FormGroup
				name="personalInfo"
				validators={{
					onDynamic: PersonalInfoSchema,
				}}
				onGroupSubmit={() => {
					setStep(step + 1);
				}}
				children={(formGroup) => (
					<form
						className="flex flex-col"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							formGroup.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Subscribe selector={(state) => state.values.personalInfo}>
								{(personalInfo) => (
									<form.AppField
										name="personalInfo.profilePicUrl"
										children={(field) => {
											const showErrors =
												field.state.meta.isTouched ||
												formGroup.state.meta.submissionAttempts > 0;
											const isInvalid = showErrors && !field.state.meta.isValid;
											return (
												<ProfilePicUploadField
													id={field.name}
													value={field.state.value}
													firstName={personalInfo.firstName}
													lastName={personalInfo.lastName}
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
								<form.AppField
									name="personalInfo.firstName"
									children={(field) => {
										const showErrors =
											field.state.meta.isTouched ||
											formGroup.state.meta.submissionAttempts > 0;
										const isInvalid = showErrors && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>First name</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													autoComplete="given-name"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>

								<form.AppField
									name="personalInfo.lastName"
									children={(field) => {
										const showErrors =
											field.state.meta.isTouched ||
											formGroup.state.meta.submissionAttempts > 0;
										const isInvalid = showErrors && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Last name</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													autoComplete="family-name"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
							</div>

							<form.AppField
								name="personalInfo.dateOfBirth"
								children={(field) => {
									const showErrors =
										field.state.meta.isTouched ||
										formGroup.state.meta.submissionAttempts > 0;
									const isInvalid = showErrors && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												Date of birth
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="date"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>

							<form.AppField
								name="personalInfo.email"
								children={(field) => {
									const showErrors =
										field.state.meta.isTouched ||
										formGroup.state.meta.submissionAttempts > 0;
									const isInvalid = showErrors && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Email</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="email"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												autoComplete="email"
												placeholder="name@institution.edu"
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>
						</FieldGroup>

						<div className="mt-6 flex justify-end">
							<Button type="submit">Continue</Button>
						</div>
					</form>
				)}
			/>
		);
	},
});
