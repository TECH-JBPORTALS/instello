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
import { Separator } from "@instello/ui/components/separator";
import { Textarea } from "@instello/ui/components/textarea";
import { IconAlertCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { useInsMutation, useInstitutionSlug } from "@/hooks/convex-react";
import {
	NewSubjectSchema,
	SUBJECT_COLOR_PALETTE,
	SubjectAliasSchema,
	SubjectCodeSchema,
} from "../constants";
import { SubjectColorField } from "../forms/subject-color-field";
import { SubjectAvatar } from "./subject-avatar";

export function NewSubjectDialog({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const institutionSlug = useInstitutionSlug();
	const convex = useConvex();
	const createSubject = useInsMutation(api.subject.mutations.create);
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
			onSubmit: NewSubjectSchema,
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
						<div className="grid grid-flow-row grid-cols-4 gap-4">
							<form.Subscribe
								selector={(state) => ({
									name: state.values.name,
									color: state.values.color,
								})}
							>
								{({ name, color }) => (
									<div className="col-span-1">
										<SubjectAvatar size="xl" name={name} color={color} />
									</div>
								)}
							</form.Subscribe>

							<form.Field
								name="color"
								children={(field) => {
									const showErrors =
										field.state.meta.isTouched ||
										field.state.meta.errors.length > 0;
									const isInvalid = showErrors && !field.state.meta.isValid;

									return (
										<Field data-invalid={isInvalid} className="col-span-3">
											<SubjectColorField
												value={field.state.value}
												onChange={field.handleChange}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>
						</div>

						<Separator />

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
								onChange: SubjectCodeSchema,
								onChangeAsync: async ({ value }) => {
									const code = value.trim();
									if (!code) return undefined;

									const parsed = v.safeParse(SubjectCodeSchema, code);
									if (!parsed.success) return undefined;

									const { available } = await convex.query(
										api.subject.queries.checkCode,
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
								onChange: SubjectAliasSchema,
								onChangeAsync: async ({ value }) => {
									const alias = value.trim();
									if (!alias) return undefined;

									const parsed = v.safeParse(SubjectAliasSchema, alias);
									if (!parsed.success) return undefined;

									const { available } = await convex.query(
										api.subject.queries.checkAlias,
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
