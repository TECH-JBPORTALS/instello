"use client";

import { api } from "@instello/convex/api";
import { ERROR_CODES } from "@instello/convex/errors";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
import { Button } from "@instello/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@instello/ui/components/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import { IconAlertCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useConvex, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { useInstitutionSlug } from "@/hooks/convex-react";

const AliasSchema = v.pipe(
	v.string(),
	v.slug("Allowed only alphanumeric characters and hyphens"),
	v.nonEmpty("Program alias is required"),
);

const NewProgramSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty("Program name is required")),
	alias: AliasSchema,
});

export function NewProgramDialog({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const institutionSlug = useInstitutionSlug();
	const convex = useConvex();
	const createProgram = useMutation(api.programs.create);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm({
		defaultValues: {
			name: "",
			alias: "",
		},
		validationLogic: revalidateLogic(),
		validators: {
			onChange: NewProgramSchema,
		},
		onSubmit: async ({ value }) => {
			setGlobalError(null);
			setIsSubmitting(true);

			try {
				await createProgram({
					name: value.name.trim(),
					alias: value.alias.trim(),
					slug: institutionSlug,
				});

				form.reset();
				setOpen(false);
			} catch (error) {
				setGlobalError(
					error instanceof ConvexError
						? error.data.message
						: "Failed to create program",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
			setGlobalError(null);
		}
	}, [open, form]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Setup new program</DialogTitle>
					<DialogDescription>
						Setup a new program to get started. You can add more programs later.
					</DialogDescription>
				</DialogHeader>
				{globalError && (
					<Alert variant="destructive" className="mb-4">
						<IconAlertCircle />
						<AlertTitle>{globalError}</AlertTitle>
						<AlertDescription>Review the form and try again.</AlertDescription>
					</Alert>
				)}
				<form
					id="new-program-form"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="name"
							children={(field) => {
								const showErrors =
									field.state.meta.isTouched ||
									field.state.meta.errors.length > 0;

								const isInvalid = showErrors && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Program name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="eg. Aerospace Engineering"
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="alias"
							validators={{
								onChange: AliasSchema,
								onChangeAsync: async ({ value }) => {
									const alias = value.trim();
									if (!alias) return undefined;

									const parsed = v.safeParse(AliasSchema, alias);
									if (!parsed.success) return undefined;

									const { available } = await convex.query(
										api.programs.checkAlias,
										{ slug: institutionSlug, alias },
									);

									if (!available) {
										return ERROR_CODES.PROGRAM.ALIAS_ALREADY_EXISTS.message;
									}

									return undefined;
								},
								onChangeAsyncDebounceMs: 500,
							}}
							children={(field) => {
								const showErrors =
									field.state.meta.isTouched ||
									field.state.meta.errors.length > 0;

								const isInvalid = showErrors && !field.state.meta.isValid;
								const alias = field.state.value.trim();
								const isChecking = field.state.meta.isValidating;
								const showAvailable =
									alias.length > 0 &&
									field.state.meta.isDirty &&
									!isChecking &&
									field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Program Alias</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="eg. ae"
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError
												errors={field.state.meta.errors.map((error) =>
													typeof error === "string"
														? { message: error }
														: error,
												)}
											/>
										)}
										{isChecking && alias.length > 0 && (
											<FieldDescription>
												Checking availability…
											</FieldDescription>
										)}
										{showAvailable && !isInvalid && (
											<FieldDescription className="flex items-center-safe gap-0.5 text-success">
												<IconCircleCheckFilled className="size-4" />
												<span>This alias is available</span>
											</FieldDescription>
										)}
										{!isChecking && !showAvailable && !isInvalid && (
											<FieldDescription>
												It's another short name which you wanna call it. It
												should be unique inside this institution.
											</FieldDescription>
										)}
									</Field>
								);
							}}
						/>
					</FieldGroup>
				</form>
				<DialogFooter>
					<Field orientation={"horizontal"} className="justify-end">
						<DialogClose render={<Button variant={"outline"}>Cancel</Button>} />
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isFormSubmitting]) => (
								<Button
									disabled={!canSubmit || isSubmitting || isFormSubmitting}
									form="new-program-form"
									type="submit"
								>
									{isSubmitting ? "Creating…" : "Create"}
								</Button>
							)}
						</form.Subscribe>
					</Field>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
