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
import { Textarea } from "@instello/ui/components/textarea";
import { withForm } from "@/hooks/form";
import { INDIAN_STATES } from "@/lib/indian-states";
import { optionalIndianPhoneNumberInputSchema } from "@/lib/phone";
import { addStudentFormOpt, FamilySchema } from "./shared-form";

export const FamilyStep = withForm({
	...addStudentFormOpt,
	props: {
		step: 3,
		setStep: (_step: number) => {},
	},
	render: function Render({ form, step, setStep }) {
		return (
			<form.FormGroup
				name="family"
				validators={{
					onDynamic: FamilySchema,
				}}
				onGroupSubmit={() => {
					form.handleSubmit();
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
							<div className="grid gap-5 sm:grid-cols-2">
								<form.AppField
									name="family.fatherName"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												Father&apos;s name (optional)
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
										</Field>
									)}
								/>

								<form.AppField
									name="family.fatherPhoneNumber"
									validators={{
										onChange: optionalIndianPhoneNumberInputSchema,
										onBlur: optionalIndianPhoneNumberInputSchema,
									}}
									children={(field) => {
										const showErrors =
											field.state.meta.isTouched ||
											formGroup.state.meta.submissionAttempts > 0;
										const isInvalid = showErrors && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Father&apos;s phone (optional)
												</FieldLabel>
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
													placeholder="+91 98765 43210"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
							</div>

							<div className="grid gap-5 sm:grid-cols-2">
								<form.AppField
									name="family.motherName"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												Mother&apos;s name (optional)
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
										</Field>
									)}
								/>

								<form.AppField
									name="family.motherPhoneNumber"
									validators={{
										onChange: optionalIndianPhoneNumberInputSchema,
										onBlur: optionalIndianPhoneNumberInputSchema,
									}}
									children={(field) => {
										const showErrors =
											field.state.meta.isTouched ||
											formGroup.state.meta.submissionAttempts > 0;
										const isInvalid = showErrors && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Mother&apos;s phone (optional)
												</FieldLabel>
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
													placeholder="+91 98765 43210"
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
								name="family.addressLine"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											Address (optional)
										</FieldLabel>
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="Building, street, landmark"
											rows={3}
										/>
									</Field>
								)}
							/>

							<div className="grid gap-5 sm:grid-cols-2">
								<form.AppField
									name="family.city"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												City (optional)
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												autoComplete="address-level2"
											/>
										</Field>
									)}
								/>

								<form.AppField
									name="family.state"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												State (optional)
											</FieldLabel>
											<Select
												name={field.name}
												value={field.state.value || null}
												onValueChange={(value) => {
													field.handleChange(value ?? "");
													field.handleBlur();
												}}
											>
												<SelectTrigger id={field.name} className="w-full">
													<SelectValue placeholder="Select state" />
												</SelectTrigger>
												<SelectContent>
													{INDIAN_STATES.map((state) => (
														<SelectItem key={state} value={state}>
															{state}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</Field>
									)}
								/>
							</div>

							<form.AppField
								name="family.postalCode"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											Postal code (optional)
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											inputMode="numeric"
											autoComplete="postal-code"
										/>
									</Field>
								)}
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
								<form.SubscribeButton label="Add student" />
							</form.AppForm>
						</div>
					</form>
				)}
			/>
		);
	},
});
