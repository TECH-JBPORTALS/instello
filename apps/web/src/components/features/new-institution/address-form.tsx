"use client";

import { Button } from "@instello/ui/components/button";
import {
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Textarea } from "@instello/ui/components/textarea";
import { withForm } from "@/hooks/form";
import {
	AddressSchema,
	INDIAN_STATES,
	newInstitutionFormOpt,
} from "./shared-form";

export const AddressForm = withForm({
	...newInstitutionFormOpt,
	props: {
		step: 1,
		setStep: (_step: number) => {},
	},
	render: function Render({ form, step, setStep }) {
		return (
			<form.FormGroup
				name="address"
				validators={{
					onDynamic: AddressSchema,
				}}
				onGroupSubmit={() => {
					form.handleSubmit();
				}}
				children={(formGroup) => {
					return (
						<form
							className="flex min-h-[520px] min-w-sm flex-col"
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								formGroup.handleSubmit();
							}}
						>
							<CardHeader className="shrink-0 p-0">
								<CardTitle className="text-lg">Institution address</CardTitle>
								<CardDescription>
									Enter the official location of your institution
								</CardDescription>
							</CardHeader>
							<CardContent className="flex-1 px-0 py-4">
								<FieldGroup>
									<form.AppField
										name="address.addressLine"
										children={(field) => {
											const showErrors =
												field.state.meta.isTouched ||
												formGroup.state.meta.submissionAttempts > 0;
											const isInvalid =
												showErrors && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>
														Street address
													</FieldLabel>
													<Textarea
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) =>
															field.handleChange(e.target.value)
														}
														aria-invalid={isInvalid}
														placeholder="Building, street, landmark"
														autoComplete="street-address"
														rows={3}
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									/>

									<form.AppField
										name="address.district"
										children={(field) => {
											const showErrors =
												field.state.meta.isTouched ||
												formGroup.state.meta.submissionAttempts > 0;
											const isInvalid =
												showErrors && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>District</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) =>
															field.handleChange(e.target.value)
														}
														aria-invalid={isInvalid}
														placeholder="Bangalore Urban"
														autoComplete="address-level2"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									/>

									<div className="grid gap-5 sm:grid-cols-2">
										<form.AppField
											name="address.state"
											children={(field) => {
												const showErrors =
													field.state.meta.isTouched ||
													formGroup.state.meta.submissionAttempts > 0;
												const isInvalid =
													showErrors && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>State</FieldLabel>
														<Select
															name={field.name}
															value={field.state.value || null}
															onValueChange={(value) => {
																field.handleChange(value ?? "");
																field.handleBlur();
															}}
														>
															<SelectTrigger
																id={field.name}
																className="w-full"
																aria-invalid={isInvalid}
															>
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
														{isInvalid && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</Field>
												);
											}}
										/>

										<form.AppField
											name="address.zipCode"
											children={(field) => {
												const showErrors =
													field.state.meta.isTouched ||
													formGroup.state.meta.submissionAttempts > 0;
												const isInvalid =
													showErrors && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name}>
															PIN code
														</FieldLabel>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															aria-invalid={isInvalid}
															inputMode="numeric"
															maxLength={6}
															placeholder="560001"
															autoComplete="postal-code"
														/>
														{isInvalid && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</Field>
												);
											}}
										/>
									</div>
								</FieldGroup>
							</CardContent>
							<CardFooter className="mt-auto shrink-0 border-t-0 bg-transparent">
								<form.AppForm>
									<Field orientation={"horizontal"} className="justify-end">
										<Button
											type="button"
											variant={"outline"}
											onClick={() => setStep(step - 1)}
										>
											Back
										</Button>
										<form.SubscribeButton label="Create institution" />
									</Field>
								</form.AppForm>
							</CardFooter>
						</form>
					);
				}}
			/>
		);
	},
});
