"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useEffect, useState } from "react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { cn } from "@/lib/utils";

export type InlineFormFieldRenderProps<TValue> = {
	value: TValue;
	onChange: (value: TValue) => void;
	onBlur: () => void;
	onEscape: () => void;
	submit: () => void;
	isSubmitting: boolean;
	isInvalid: boolean;
	errors: Array<{ message?: string } | undefined>;
};

export type InlineFormFieldProps<TValue = string> = {
	fieldName: string;
	savedValue: TValue;
	onSave: (value: TValue) => Promise<void>;
	validator?: object;
	normalize?: (value: TValue) => TValue;
	isUnchanged?: (next: TValue, saved: TValue) => boolean;
	className?: string;
	children: (field: InlineFormFieldRenderProps<TValue>) => React.ReactNode;
};

function defaultNormalize<TValue>(value: TValue): TValue {
	if (typeof value === "string") {
		return value.trim() as TValue;
	}
	return value;
}

function defaultIsUnchanged<TValue>(next: TValue, saved: TValue): boolean {
	if (typeof next === "string" && typeof saved === "string") {
		return next.trim() === saved.trim();
	}
	return next === saved;
}

export function InlineFormField<TValue = string>({
	fieldName,
	savedValue,
	onSave,
	validator,
	normalize = defaultNormalize,
	isUnchanged = defaultIsUnchanged,
	className,
	children,
}: InlineFormFieldProps<TValue>) {
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { [fieldName]: savedValue } as Record<string, TValue>,
		...(validator
			? {
					validationLogic: revalidateLogic(),
					validators: { onChange: validator as never },
				}
			: {}),
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			const fieldValue = value[fieldName as keyof typeof value] as TValue;
			const normalized = normalize(fieldValue);

			if (isUnchanged(normalized, savedValue)) return;

			try {
				await onSave(normalized);
				form.reset({ [fieldName]: normalized });
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
			className={cn("w-full text-left", className)}
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

							return children({
								value: field.state.value as TValue,
								onChange: (value) => field.handleChange(value as never),
								onBlur: () => {
									field.handleBlur();
									void form.handleSubmit();
								},
								onEscape: () => {
									form.reset({ [fieldName]: savedValue });
									setSubmitError(null);
									field.handleBlur();
								},
								submit: () => {
									void form.handleSubmit();
								},
								isSubmitting,
								isInvalid,
								errors: field.state.meta.errors as Array<
									{ message?: string } | undefined
								>,
							});
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
