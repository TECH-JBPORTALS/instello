"use client";

import { Button } from "@instello/ui/components/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { withForm } from "@/hooks/form";
import { GENDER_LABELS, GENDER_OPTIONS } from "../constants";
import { addStudentFormOpt, PersonalInfoSchema } from "./shared-form";
import { StudentImageUploadField } from "./student-image-upload-field";

export const PersonalInfoStep = withForm({
	...addStudentFormOpt,
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
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							formGroup.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Subscribe selector={(state) => state.values.personalInfo}>
								{(personalInfo) => (
									<form.AppField
										name="personalInfo.imageFile"
										children={(field) => (
											<StudentImageUploadField
												id={field.name}
												firstName={personalInfo.firstName}
												lastName={personalInfo.lastName}
												file={field.state.value}
												onFileSelect={(file) => {
													field.handleChange(file);
													field.handleBlur();
												}}
												onRemove={() => {
													field.handleChange(null);
													field.handleBlur();
												}}
											/>
										)}
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
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
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
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
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
								name="personalInfo.gender"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Gender</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												if (value) {
													field.handleChange(value as typeof field.state.value);
												}
											}}
										>
											<SelectTrigger id={field.name}>
												<SelectValue className={"capitalize"} />
											</SelectTrigger>
											<SelectContent>
												{GENDER_OPTIONS.map((option) => (
													<SelectItem key={option} value={option}>
														{GENDER_LABELS[option]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
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
