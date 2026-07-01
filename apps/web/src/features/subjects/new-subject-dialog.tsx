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
import { Textarea } from "@instello/ui/components/textarea";
import { cn } from "@instello/ui/lib/utils";
import { IconAlertCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { useInsMutation, useInstitutionSlug } from "@/hooks/convex-react";
import { SUBJECT_COLOR_PALETTE } from "./constants";

const AliasSchema = v.pipe(
	v.string(),
	v.slug("Allowed only alphanumeric characters and hyphens"),
	v.nonEmpty("Subject alias is required"),
);

const CodeSchema = v.pipe(
	v.string(),
	v.nonEmpty("Subject code is required"),
	v.regex(
		/^[A-Za-z0-9-]+$/,
		"Allowed only alphanumeric characters and hyphens",
	),
);

const NewSubjectSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty("Subject name is required")),
	code: CodeSchema,
	alias: AliasSchema,
	color: v.pipe(v.string(), v.nonEmpty("Color is required")),
	description: v.string(),
});

export function NewSubjectDialog({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const institutionSlug = useInstitutionSlug();
	const convex = useConvex();
	const createSubject = useInsMutation(api.subjects.create);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const defaultColor: string = SUBJECT_COLOR_PALETTE[0]?.value ?? "#3B82F6";

	const form = useForm({
		defaultValues: {
			name: "",
			code: "",
			alias: "",
			color: defaultColor,
			description: "",
		},
		validationLogic: revalidateLogic(),
		validators: {
			onChange: NewSubjectSchema,
		},
		onSubmit: async ({ value }) => {
			setGlobalError(null);
			setIsSubmitting(true);

			try {
				await createSubject({
					name: value.name.trim(),
					code: value.code.trim(),
					alias: value.alias.trim(),
					color: value.color,
					description: value.description?.trim() || undefined,
				});

				form.reset();
				setOpen(false);
			} catch (error) {
				setGlobalError(
					error instanceof ConvexError
						? error.data.message
						: "Failed to create subject",
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
					<DialogTitle>Add new subject</DialogTitle>
					<DialogDescription>
						Create a subject in your institution catalog. You can assign it to
						programs later.
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
					id="new-subject-form"
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
										<FieldLabel htmlFor={field.name}>Subject name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="eg. Applied Science"
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
							name="code"
							validators={{
								onChange: CodeSchema,
								onChangeAsync: async ({ value }) => {
									const code = value.trim();
									if (!code) return undefined;

									const parsed = v.safeParse(CodeSchema, code);
									if (!parsed.success) return undefined;

									const { available } = await convex.query(
										api.subjects.checkCode,
										{ slug: institutionSlug, code },
									);

									if (!available) {
										return ERROR_CODES.SUBJECT.CODE_ALREADY_EXISTS.message;
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
								const code = field.state.value.trim();
								const isChecking = field.state.meta.isValidating;
								const showAvailable =
									code.length > 0 &&
									field.state.meta.isDirty &&
									!isChecking &&
									field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Subject code</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="eg. 15CSE09T"
											autoComplete="off"
											className="uppercase"
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
										{isChecking && code.length > 0 && (
											<FieldDescription>
												Checking availability…
											</FieldDescription>
										)}
										{showAvailable && !isInvalid && (
											<FieldDescription className="flex items-center-safe gap-0.5 text-success">
												<IconCircleCheckFilled className="size-4" />
												<span>This code is available</span>
											</FieldDescription>
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
										api.subjects.checkAlias,
										{ slug: institutionSlug, alias },
									);

									if (!available) {
										return ERROR_CODES.SUBJECT.ALIAS_ALREADY_EXISTS.message;
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
										<FieldLabel htmlFor={field.name}>Subject alias</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="eg. applied-science"
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
									</Field>
								);
							}}
						/>

						<form.Field
							name="color"
							children={(field) => {
								const showErrors =
									field.state.meta.isTouched ||
									field.state.meta.errors.length > 0;
								const isInvalid = showErrors && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel>Color</FieldLabel>
										<div className="flex flex-wrap gap-2">
											{SUBJECT_COLOR_PALETTE.map((option) => (
												<button
													key={option.value}
													type="button"
													aria-label={option.label}
													className={cn(
														"size-8 rounded-lg border-2 transition-transform hover:scale-105",
														field.state.value === option.value
															? "border-foreground scale-105"
															: "border-transparent",
													)}
													style={{ backgroundColor: option.value }}
													onClick={() => field.handleChange(option.value)}
												/>
											))}
										</div>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="description"
							children={(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>
										Description (optional)
									</FieldLabel>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Brief description of the subject"
										rows={3}
									/>
								</Field>
							)}
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
									form="new-subject-form"
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
