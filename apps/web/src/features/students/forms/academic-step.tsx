"use client";

import type { Id } from "@instello/convex/dataModel";
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
import { useEffect } from "react";
import { withForm } from "@/hooks/form";
import { addStudentFormOpt, buildAcademicSchema } from "./shared-form";

type AcademicStepProps = {
	step: number;
	setStep: (step: number) => void;
	categories: Array<{ _id: Id<"institutionStudentCategories">; name: string }>;
	batches: Array<{ _id: Id<"classBatches">; label: string }>;
	isGroupsEnabled: boolean;
};

export const AcademicStep = withForm({
	...addStudentFormOpt,
	props: {
		step: 1,
		setStep: (_step: number) => {},
		categories: [] as AcademicStepProps["categories"],
		batches: [] as AcademicStepProps["batches"],
		isGroupsEnabled: false,
	},
	render: function Render({
		form,
		step,
		setStep,
		categories,
		batches,
		isGroupsEnabled,
	}) {
		useEffect(() => {
			if (categories[0] && !form.getFieldValue("academic.categoryId")) {
				form.setFieldValue("academic.categoryId", categories[0]._id);
			}
		}, [categories, form]);

		return (
			<form.FormGroup
				name="academic"
				validators={{
					onDynamic: buildAcademicSchema(isGroupsEnabled),
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
								name="academic.usn"
								children={(field) => {
									const showErrors =
										field.state.meta.isTouched ||
										formGroup.state.meta.submissionAttempts > 0;
									const isInvalid = showErrors && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>USN</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
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
								name="academic.categoryId"
								children={(field) => {
									const showErrors =
										field.state.meta.isTouched ||
										formGroup.state.meta.submissionAttempts > 0;
									const isInvalid = showErrors && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Category</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={(value) => {
													if (value) field.handleChange(value);
												}}
											>
												<SelectTrigger id={field.name}>
													<SelectValue>
														{field.state.value
															? categories.find(
																	(category) =>
																		category._id === field.state.value,
																)?.name
															: "Select category"}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{categories.map((category) => (
														<SelectItem key={category._id} value={category._id}>
															{category.name}
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

							{isGroupsEnabled && (
								<form.AppField
									name="academic.batchId"
									children={(field) => {
										const showErrors =
											field.state.meta.isTouched ||
											formGroup.state.meta.submissionAttempts > 0;
										const isInvalid = showErrors && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Batch</FieldLabel>
												<Select
													value={field.state.value}
													onValueChange={(value) => {
														if (value) field.handleChange(value);
													}}
												>
													<SelectTrigger id={field.name}>
														<SelectValue>
															{field.state.value
																? batches.find(
																		(batch) => batch._id === field.state.value,
																	)?.label
																: "Select batch"}
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														{batches.map((batch) => (
															<SelectItem key={batch._id} value={batch._id}>
																{batch.label}
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
							)}

							<form.AppField
								name="academic.apaarId"
								children={(field) => {
									const showErrors =
										field.state.meta.isTouched ||
										formGroup.state.meta.submissionAttempts > 0;
									const isInvalid = showErrors && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												APAAR ID (optional)
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												placeholder="12-digit code"
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
