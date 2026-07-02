"use client";

import { FieldError } from "@instello/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { Spinner } from "@instello/ui/components/spinner";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useEffect, useState } from "react";
import { getConvexErrorMessage } from "@/lib/convex-error";

export function InlineSubjectTextField({
	fieldName,
	savedValue,
	validator,
	onSave,
	placeholder,
	inputClassName,
}: {
	fieldName: string;
	savedValue: string;
	validator: object;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	inputClassName?: string;
}) {
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

			const trimmed = fieldValue.trim();
			if (trimmed === savedValue.trim()) return;

			try {
				await onSave(trimmed);
				form.reset({ [fieldName]: trimmed });
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
											value={field.state.value}
											onChange={(event) => {
												setSubmitError(null);
												field.handleChange(event.target.value);
											}}
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
											placeholder={placeholder}
											aria-invalid={isInvalid}
											className={inputClassName}
										/>
									</InputGroup>
									{isInvalid ? (
										<SubjectFieldError errors={field.state.meta.errors} />
									) : submitError ? (
										<p className="mt-1 text-xs text-destructive" role="alert">
											{submitError}
										</p>
									) : null}
								</>
							);
						}}
					</form.Field>
				)}
			</form.Subscribe>
		</form>
	);
}

function getFirstFieldErrorMessage(
	errors: Array<{ message?: string } | string | undefined>,
): string | null {
	for (const error of errors) {
		if (typeof error === "string" && error.length > 0) return error;
		if (error && typeof error === "object" && error.message) {
			return error.message;
		}
	}

	return null;
}

function SubjectFieldError({
	errors,
}: {
	errors: Array<{ message?: string } | string | undefined>;
}) {
	const message = getFirstFieldErrorMessage(errors);
	if (!message) return null;

	return <FieldError>{message}</FieldError>;
}

export { SubjectFieldError };
