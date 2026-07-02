"use client";

import { Button } from "@instello/ui/components/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import { withForm } from "@/hooks/form";
import { FacultyImageUploadField } from "./faculty-image-upload-field";
import { addFacultyFormOpt, PersonalInfoSchema } from "./shared-form";

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
										name="personalInfo.imageFile"
										children={(field) => (
											<FacultyImageUploadField
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
