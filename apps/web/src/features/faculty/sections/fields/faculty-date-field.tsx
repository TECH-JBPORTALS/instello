"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { FieldError } from "@instello/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { Spinner } from "@instello/ui/components/spinner";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";

export type FacultyFieldProps = {
	facultyId: Id<"faculty">;
	savedValue: string;
};

type InlineDateFieldProps = {
	fieldName: string;
	savedValue: string;
	validator: object;
	onSave: (value: string) => Promise<void>;
};

function InlineDateField({
	fieldName,
	savedValue,
	validator,
	onSave,
}: InlineDateFieldProps) {
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { [fieldName]: savedValue },
		validationLogic: revalidateLogic(),
		validators: {
			onChange: validator as never,
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			const fieldValue = value[fieldName as keyof typeof value];
			if (typeof fieldValue !== "string") return;

			if (fieldValue === savedValue) return;

			try {
				await onSave(fieldValue);
				form.reset({ [fieldName]: fieldValue });
			} catch (error) {
				setSubmitError(getConvexErrorMessage(error, "Failed to save"));
			}
		},
	});

	useEffect(() => {
		form.reset({ [fieldName]: savedValue });
	}, [savedValue, fieldName, form]);

	return (
		<form
			className="w-full text-left"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<form.Field name={fieldName}>
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<>
									<InputGroup>
										{isSubmitting && (
											<InputGroupAddon align="inline-start">
												<Spinner className="size-4 text-muted-foreground" />
											</InputGroupAddon>
										)}
										<InputGroupInput
											type="date"
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onBlur={() => {
												field.handleBlur();
												void form.handleSubmit();
											}}
											onKeyDown={(event) => {
												if (event.key === "Escape") {
													form.reset({ [fieldName]: savedValue });
													setSubmitError(null);
													field.handleBlur();
												}
											}}
											disabled={isSubmitting}
											aria-invalid={isInvalid}
										/>
									</InputGroup>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</>
							);
						}}
					</form.Field>
				)}
			</form.Subscribe>
			{submitError && (
				<p className="mt-1 text-xs text-destructive" role="alert">
					{submitError}
				</p>
			)}
		</form>
	);
}

function formatJoinedDate(timestamp?: number) {
	if (!timestamp) return "";
	return new Date(timestamp).toISOString().slice(0, 10);
}

export function DateOfBirthField({ facultyId, savedValue }: FacultyFieldProps) {
	const update = useInsMutation(api.faculty.updatePersonalInfo);

	return (
		<InlineDateField
			fieldName="dateOfBirth"
			savedValue={savedValue}
			validator={v.object({
				dateOfBirth: v.pipe(
					v.string(),
					v.nonEmpty("Date of birth is required"),
				),
			})}
			onSave={async (dateOfBirth) => {
				await update({ id: facultyId, body: { dateOfBirth } });
			}}
		/>
	);
}

export function JoinedDateField({
	facultyId,
	savedTimestamp,
}: {
	facultyId: Id<"faculty">;
	savedTimestamp?: number;
}) {
	const update = useInsMutation(api.faculty.updateEmployment);
	const savedValue = formatJoinedDate(savedTimestamp);

	return (
		<InlineDateField
			fieldName="joinedDate"
			savedValue={savedValue}
			validator={v.object({
				joinedDate: v.string(),
			})}
			onSave={async (joinedDate) => {
				await update({
					id: facultyId,
					body: {
						joinedDate: joinedDate ? new Date(joinedDate).getTime() : undefined,
					},
				});
			}}
		/>
	);
}
