"use client";

import { Button } from "@instello/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import { withForm } from "@/hooks/form";
import { indianPhoneNumberInputSchema } from "@/lib/phone";
import { addFacultyFormOpt, ContactSchema } from "./shared-form";

export const ContactStep = withForm({
	...addFacultyFormOpt,
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
					form.handleSubmit();
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
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												autoComplete="tel"
												placeholder="+91 98765 43210"
											/>
											<FieldDescription>
												Used for institution communications. Verification will
												be required later.
											</FieldDescription>
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
							<form.AppForm>
								<form.SubscribeButton label="Add staff" />
							</form.AppForm>
						</div>
					</form>
				)}
			/>
		);
	},
});
