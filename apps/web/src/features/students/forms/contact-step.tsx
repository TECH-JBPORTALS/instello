"use client";

import { Button } from "@instello/ui/components/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import * as v from "valibot";
import { withForm } from "@/hooks/form";
import { indianPhoneNumberInputSchema } from "@/lib/phone";
import { addStudentFormOpt, ContactSchema } from "./shared-form";

const emailSchema = v.pipe(
	v.string(),
	v.nonEmpty("Email is required"),
	v.email("Invalid email address"),
);

export const ContactStep = withForm({
	...addStudentFormOpt,
	props: {
		step: 2,
		setStep: (_step: number) => {},
	},
	render: function Render({ form, step, setStep }) {
		return (
			<form.FormGroup
				name="contact"
				validators={{
					onDynamic: ContactSchema,
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
							<form.AppField
								name="contact.email"
								validators={{
									onChange: emailSchema,
									onBlur: emailSchema,
								}}
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
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
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

							<form.AppField
								name="contact.phoneNumber"
								validators={{
									onChange: indianPhoneNumberInputSchema,
									onBlur: indianPhoneNumberInputSchema,
								}}
								children={(field) => {
									const showErrors =
										field.state.meta.isTouched ||
										formGroup.state.meta.submissionAttempts > 0;
									const isInvalid = showErrors && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="tel"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												aria-invalid={isInvalid}
												autoComplete="tel"
												placeholder="+91 98765 43210"
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>
						</FieldGroup>

						<div className="mt-6 flex justify-between">
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep(step - 1)}
							>
								Back
							</Button>
							<Button type="submit">Continue</Button>
						</div>
					</form>
				)}
			/>
		);
	},
});
