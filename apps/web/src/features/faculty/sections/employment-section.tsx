"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
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
import { revalidateLogic } from "@tanstack/react-form-nextjs";
import { useState } from "react";
import { useInsMutation } from "@/hooks/convex-react";
import { useAppForm } from "@/hooks/form";
import { PatchEmploymentSchema } from "../forms/shared-form";

function formatJoinedDate(timestamp?: number) {
	if (!timestamp) return "";
	return new Date(timestamp).toISOString().slice(0, 10);
}

type EmploymentSectionProps = {
	faculty: {
		_id: Id<"faculty">;
		staffId: string;
		designation: string;
		qualification: string;
		specialization: string;
		joinedDate?: number;
	};
	disabled?: boolean;
};

export function EmploymentSection({
	faculty,
	disabled,
}: EmploymentSectionProps) {
	const updateEmployment = useInsMutation(api.faculty.updateEmployment);
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			staffId: faculty.staffId,
			designation: faculty.designation,
			qualification: faculty.qualification,
			specialization: faculty.specialization,
			joinedDate: formatJoinedDate(faculty.joinedDate),
		},
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: PatchEmploymentSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await updateEmployment({
					id: faculty._id,
					body: {
						staffId: value.staffId,
						designation: value.designation,
						qualification: value.qualification,
						specialization: value.specialization,
						joinedDate: value.joinedDate
							? new Date(value.joinedDate).getTime()
							: undefined,
					},
				});
			} catch (submitError) {
				setError(
					submitError instanceof Error
						? submitError.message
						: "Failed to update employment details",
				);
			}
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Employment</CardTitle>
				<CardDescription>
					Staff identification and role details for this faculty member.
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
						<form.Field
							name="staffId"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Staff ID</FieldLabel>
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
							name="designation"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Designation</FieldLabel>
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

						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field
								name="qualification"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												Qualification
											</FieldLabel>
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
								name="specialization"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												Specialization
											</FieldLabel>
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
							name="joinedDate"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Joined date (optional)
										</FieldLabel>
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
