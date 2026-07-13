"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
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
} from "@instello/ui/components/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Textarea } from "@instello/ui/components/textarea";
import { IconAlertCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import * as v from "valibot";
import {
	useInsMutation,
	useInsQuery,
	useInstitutionSlug,
} from "@/hooks/convex-react";
import { classPath } from "@/lib/class-path";
import { slugifyName } from "@/lib/slugify";
import { protocol } from "@/lib/utils";
import { ClassSlugSchema, NewClassSchema } from "./shared-form";

export function NewClassDialog({
	open,
	setOpen,
	programId,
	programAlias,
	onCreated,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	programId: Id<"programs">;
	programAlias?: string;
	onCreated?: (slug: string) => void;
}) {
	const router = useRouter();
	const institutionSlug = useInstitutionSlug();
	const convex = useConvex();
	const createClass = useInsMutation(api.classes.create);
	const adoptedPattern = useInsQuery(
		api.academicPattern.queries.getAdoptedForActiveInstitution,
		open ? {} : "skip",
	);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const slugManuallyEditedRef = useRef(false);

	const sortedStages = useMemo(() => {
		if (!adoptedPattern?.stages) return [];
		return [...adoptedPattern.stages].sort(
			(a, b) => a.sequenceNumber - b.sequenceNumber,
		);
	}, [adoptedPattern?.stages]);

	const defaultStageId = sortedStages[0]?._id ?? ("" as const);
	const slugPathPrefix = programAlias ? `/p/${programAlias}/c/` : "/p/…/c/";

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
			description: "",
			currentHeadStageId: "" as string,
		},
		validationLogic: revalidateLogic(),
		validators: {
			onChange: NewClassSchema,
		},
		onSubmit: async ({ value }) => {
			setGlobalError(null);
			setIsSubmitting(true);

			try {
				const trimmedName = value.name.trim();
				const trimmedSlug = value.slug.trim();
				await createClass({
					programId,
					body: {
						name: trimmedName,
						slug: trimmedSlug,
						description: value.description.trim() || undefined,
						currentHeadStageId:
							value.currentHeadStageId as Id<"academicStages">,
					},
				});

				form.reset();
				slugManuallyEditedRef.current = false;
				setOpen(false);
				onCreated?.(trimmedSlug);
				if (programAlias) {
					router.push(classPath(programAlias, trimmedSlug, "students"));
				}
			} catch (error) {
				setGlobalError(
					error instanceof ConvexError
						? error.data.message
						: "Failed to create class",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
			slugManuallyEditedRef.current = false;
			setGlobalError(null);
			return;
		}

		if (defaultStageId) {
			form.setFieldValue("currentHeadStageId", defaultStageId);
		}
	}, [open, form, defaultStageId]);

	const noPattern = open && adoptedPattern === null;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new class</DialogTitle>
					<DialogDescription>
						Add a student batch for this program. Choose the current academic
						stage from your institution&apos;s adopted pattern.
					</DialogDescription>
				</DialogHeader>

				{noPattern && (
					<Alert variant="destructive" className="mb-4">
						<IconAlertCircle />
						<AlertTitle>No academic pattern adopted</AlertTitle>
						<AlertDescription>
							Your institution must adopt an academic pattern before creating
							classes.
						</AlertDescription>
					</Alert>
				)}

				{globalError && (
					<Alert variant="destructive" className="mb-4">
						<IconAlertCircle />
						<AlertTitle>{globalError}</AlertTitle>
						<AlertDescription>Review the form and try again.</AlertDescription>
					</Alert>
				)}

				<form
					id="new-class-form"
					onSubmit={(e) => {
						e.preventDefault();
						void form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="name"
							validators={{
								onChangeAsync: async ({ value }) => {
									const name = value.trim();
									if (!name) return undefined;

									const { available } = await convex.query(
										api.classes.checkName,
										{ slug: institutionSlug, programId, name },
									);

									if (!available) {
										return ERROR_CODES.CLASS.NAME_ALREADY_EXISTS.message;
									}

									return undefined;
								},
								onChangeAsyncDebounceMs: 500,
							}}
						>
							{(field) => {
								const showErrors =
									field.state.meta.isTouched ||
									field.state.meta.errors.length > 0;
								const isInvalid = showErrors && !field.state.meta.isValid;
								const name = field.state.value.trim();
								const isChecking = field.state.meta.isValidating;
								const showAvailable =
									name.length > 0 &&
									field.state.meta.isDirty &&
									!isChecking &&
									field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => {
												const nextName = e.target.value;
												field.handleChange(nextName);

												if (!slugManuallyEditedRef.current) {
													form.setFieldValue("slug", slugifyName(nextName));
												}
											}}
											placeholder="e.g. 2026 Batch"
											disabled={noPattern || isSubmitting}
											aria-invalid={isInvalid}
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
										{isChecking && name.length > 0 && (
											<FieldDescription>
												Checking availability…
											</FieldDescription>
										)}
										{showAvailable && !isInvalid && (
											<FieldDescription className="flex items-center-safe gap-0.5 text-success">
												<IconCircleCheckFilled className="size-4" />
												<span>This name is available</span>
											</FieldDescription>
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field
							name="slug"
							validators={{
								onChange: ClassSlugSchema,
								onChangeAsync: async ({ value }) => {
									const classSlug = value.trim();
									if (!classSlug) return undefined;

									const parsed = v.safeParse(ClassSlugSchema, classSlug);
									if (!parsed.success) return undefined;

									const { available } = await convex.query(
										api.classes.checkSlug,
										{
											slug: institutionSlug,
											programId,
											classSlug,
										},
									);

									if (!available) {
										return ERROR_CODES.CLASS.SLUG_ALREADY_EXISTS.message;
									}

									return undefined;
								},
								onChangeAsyncDebounceMs: 500,
							}}
						>
							{(field) => {
								const showErrors =
									field.state.meta.isTouched ||
									field.state.meta.errors.length > 0;
								const isInvalid = showErrors && !field.state.meta.isValid;
								const classSlug = field.state.value.trim();
								const isChecking = field.state.meta.isValidating;
								const showAvailable =
									classSlug.length > 0 &&
									field.state.meta.isDirty &&
									!isChecking &&
									field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Class slug</FieldLabel>
										<InputGroup>
											<InputGroupAddon align="inline-start">
												{protocol}://{window.location.host}
												{slugPathPrefix}
											</InputGroupAddon>
											<InputGroupInput
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => {
													slugManuallyEditedRef.current = true;
													field.handleChange(e.target.value);
												}}
												placeholder="2026-batch"
												disabled={noPattern || isSubmitting}
												aria-invalid={isInvalid}
												autoComplete="off"
											/>
										</InputGroup>
										{isInvalid && (
											<FieldError
												errors={field.state.meta.errors.map((error) =>
													typeof error === "string"
														? { message: error }
														: error,
												)}
											/>
										)}
										{isChecking && classSlug.length > 0 && (
											<FieldDescription>
												Checking availability…
											</FieldDescription>
										)}
										{showAvailable && !isInvalid && (
											<FieldDescription className="flex items-center-safe gap-0.5 text-success">
												<IconCircleCheckFilled className="size-4" />
												<span>This slug is available</span>
											</FieldDescription>
										)}
										{!isChecking && !showAvailable && !isInvalid && (
											<FieldDescription>
												Lowercase letters, numbers, and hyphens only. Must be
												unique within this program.
											</FieldDescription>
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>
										Description{" "}
										<span className="text-muted-foreground">(optional)</span>
									</FieldLabel>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Brief description of this class"
										disabled={noPattern || isSubmitting}
										rows={3}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="currentHeadStageId">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Current academic stage
										</FieldLabel>
										<Select
											value={field.state.value || null}
											onValueChange={(value) => {
												field.handleChange(value ?? "");
											}}
											disabled={
												noPattern || isSubmitting || sortedStages.length === 0
											}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue placeholder="Select stage">
													<span className="text-muted-foreground uppercase">
														{
															sortedStages.find(
																(stage) => stage._id === field.state.value,
															)?.alias
														}
													</span>
													<span>
														{
															sortedStages.find(
																(stage) => stage._id === field.state.value,
															)?.name
														}
													</span>
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{sortedStages.map((stage) => (
													<SelectItem
														key={stage._id}
														className={"flex items-center"}
														value={stage._id}
													>
														<span className="text-muted-foreground uppercase">
															{stage.alias}
														</span>
														<span>{stage.name}</span>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FieldDescription>
											The stage this class is currently in within{" "}
											{adoptedPattern?.name ?? "the academic pattern"}.
										</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>
				</form>

				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
						type="submit"
						form="new-class-form"
						disabled={noPattern || isSubmitting || sortedStages.length === 0}
					>
						{isSubmitting ? "Creating..." : "Create class"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
