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
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { PatternNameSchema } from "../../constants";

type PatternNameFieldProps = {
	patternId: Id<"academicPatterns">;
	savedValue: string;
};

export function PatternNameField({
	patternId,
	savedValue,
}: PatternNameFieldProps) {
	const patchMetadata = useMutation(api.academicPatterns.patchMetadata);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { name: savedValue },
		validationLogic: revalidateLogic(),
		validators: {
			onChange: v.object({ name: PatternNameSchema }),
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			const trimmed = value.name.trim();
			if (trimmed === savedValue.trim()) return;

			try {
				await patchMetadata({
					id: patternId,
					body: { name: trimmed },
				});
				form.reset({ name: trimmed });
			} catch (error) {
				setSubmitError(getConvexErrorMessage(error, "Failed to save name"));
			}
		},
	});

	useEffect(() => {
		form.reset({ name: savedValue });
	}, [savedValue, form]);

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
					<form.Field name="name">
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
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onBlur={field.handleBlur}
											onKeyDown={(event) => {
												if (event.key === "Escape") {
													form.reset({ name: savedValue });
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
