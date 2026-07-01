"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Spinner } from "@instello/ui/components/spinner";
import { useForm } from "@tanstack/react-form-nextjs";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { SYSTEM_YEARS_LABELS } from "../../constants";

type PatternDurationFieldProps = {
	patternId: Id<"academicPatterns">;
	savedValue: number;
	readOnly?: boolean;
};

export function PatternDurationField({
	patternId,
	savedValue,
	readOnly = false,
}: PatternDurationFieldProps) {
	const patchCore = useMutation(api.academicPatterns.patchCore);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { durationInYears: String(savedValue) },
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			const durationInYears = Number(value.durationInYears);
			if (durationInYears === savedValue) return;

			try {
				await patchCore({
					id: patternId,
					body: { durationInYears },
				});
				form.reset({ durationInYears: String(durationInYears) });
			} catch (error) {
				form.reset({ durationInYears: String(savedValue) });
				setSubmitError(getConvexErrorMessage(error, "Failed to save duration"));
			}
		},
	});

	useEffect(() => {
		form.reset({ durationInYears: String(savedValue) });
	}, [savedValue, form]);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<form.Field name="durationInYears">
						{(field) => (
							<div className="flex items-center gap-2">
								{isSubmitting && (
									<Spinner className="size-4 shrink-0 text-muted-foreground" />
								)}
								<Select
									value={field.state.value}
									onValueChange={(next) => {
										if (!next || readOnly) return;
										field.handleChange(next);
										void form.handleSubmit();
									}}
									disabled={isSubmitting || readOnly}
								>
									<SelectTrigger className="h-8 w-auto min-w-28 bg-transparent shadow-none hover:bg-accent/50">
										<SelectValue />
									</SelectTrigger>
									<SelectContent align="center">
										{Object.entries(SYSTEM_YEARS_LABELS).map(
											([optionValue, label]) => (
												<SelectItem key={optionValue} value={optionValue}>
													{label}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>
						)}
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
