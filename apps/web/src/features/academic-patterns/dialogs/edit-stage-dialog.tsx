"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@instello/ui/components/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import { Spinner } from "@instello/ui/components/spinner";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { StageMetadataSchema } from "../constants";

type EditStageDialogProps = {
	stage: {
		_id: Id<"academicStages">;
		name: string;
		alias: string;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditStageDialog({
	stage,
	open,
	onOpenChange,
}: EditStageDialogProps) {
	const patchMetadata = useMutation(api.academicStages.patchMetadata);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: stage.name,
			alias: stage.alias,
		},
		validationLogic: revalidateLogic(),
		validators: {
			onChange: StageMetadataSchema,
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			const name = value.name.trim();
			const alias = value.alias.trim();

			if (name === stage.name.trim() && alias === stage.alias.trim()) {
				onOpenChange(false);
				return;
			}

			try {
				await patchMetadata({
					id: stage._id,
					body: { name, alias },
				});
				onOpenChange(false);
			} catch (error) {
				setSubmitError(getConvexErrorMessage(error, "Failed to update stage"));
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({ name: stage.name, alias: stage.alias });
			setSubmitError(null);
		}
	}, [open, stage.name, stage.alias, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit stage</DialogTitle>
					<DialogDescription>
						Update the display name and alias for this stage.
					</DialogDescription>
				</DialogHeader>
				<form
					id="edit-stage-form"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="alias">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Alias</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>
					{submitError && (
						<p className="mt-3 text-sm text-destructive" role="alert">
							{submitError}
						</p>
					)}
				</form>
				<DialogFooter>
					<Field orientation="horizontal" className="justify-end">
						<DialogClose render={<Button variant="outline">Cancel</Button>} />
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									disabled={!canSubmit || isSubmitting}
									form="edit-stage-form"
									type="submit"
								>
									{isSubmitting ? (
										<>
											<Spinner className="size-4" />
											Saving…
										</>
									) : (
										"Save"
									)}
								</Button>
							)}
						</form.Subscribe>
					</Field>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
