"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { FieldError } from "@instello/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupTextarea,
} from "@instello/ui/components/input-group";
import { Kbd } from "@instello/ui/components/kbd";
import { Spinner } from "@instello/ui/components/spinner";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { PatternDescriptionSchema } from "../../constants";

type PatternDescriptionFieldProps = {
	patternId: Id<"academicPatterns">;
	savedValue: string;
};

export function PatternDescriptionField({
	patternId,
	savedValue,
}: PatternDescriptionFieldProps) {
	const patchMetadata = useMutation(api.academicPatterns.patchMetadata);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { description: savedValue },
		validationLogic: revalidateLogic(),
		validators: {
			onChange: v.object({ description: PatternDescriptionSchema }),
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			const trimmed = value.description.trim();
			if (trimmed === savedValue.trim()) return;

			try {
				await patchMetadata({
					id: patternId,
					body: { description: trimmed || undefined },
				});
				form.reset({ description: trimmed });
			} catch (error) {
				setSubmitError(
					getConvexErrorMessage(error, "Failed to save description"),
				);
			}
		},
	});

	useEffect(() => {
		form.reset({ description: savedValue });
	}, [savedValue, form]);

	return (
		<form
			className="mt-2 w-full max-w-full text-left"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<form.Field name="description">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<>
									<InputGroup className="h-auto min-h-fit">
										<InputGroupTextarea
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onBlur={field.handleBlur}
											onKeyDown={(event) => {
												if (event.key === "Escape") {
													form.reset({ description: savedValue });
													setSubmitError(null);
													field.handleBlur();
													return;
												}
												if (event.key !== "Enter" || event.shiftKey) return;
												event.preventDefault();
												void form.handleSubmit();
											}}
											disabled={isSubmitting}
											placeholder="Add a description…"
											aria-invalid={isInvalid}
										/>
										<InputGroupAddon align="block-end">
											{isSubmitting ? (
												<Spinner className="size-4 text-muted-foreground" />
											) : (
												<Kbd>Enter ↵</Kbd>
											)}
										</InputGroupAddon>
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
