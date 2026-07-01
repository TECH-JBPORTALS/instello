"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Textarea } from "@instello/ui/components/textarea";
import { IconAlertCircle } from "@tabler/icons-react";
import { revalidateLogic, useForm } from "@tanstack/react-form-nextjs";
import { ConvexError } from "convex/values";
import { useEffect, useMemo, useState } from "react";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { NewClassSchema } from "./shared-form";

export function NewClassDialog({
	open,
	setOpen,
	programId,
	onCreated,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	programId: Id<"programs">;
	onCreated?: (classId: Id<"classes">) => void;
}) {
	const createClass = useInsMutation(api.classes.create);
	const adoptedPattern = useInsQuery(
		api.academicPatterns.getAdoptedForActiveInstitution,
		open ? {} : "skip",
	);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const sortedStages = useMemo(() => {
		if (!adoptedPattern?.stages) return [];
		return [...adoptedPattern.stages].sort(
			(a, b) => a.sequenceNumber - b.sequenceNumber,
		);
	}, [adoptedPattern?.stages]);

	const defaultStageId = sortedStages[0]?._id ?? ("" as const);

	const form = useForm({
		defaultValues: {
			name: "",
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
				const classId = await createClass({
					programId,
					body: {
						name: value.name.trim(),
						description: value.description.trim() || undefined,
						currentHeadStageId:
							value.currentHeadStageId as Id<"academicStages">,
					},
				});

				form.reset();
				setOpen(false);
				onCreated?.(classId);
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
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g. 2026 Batch"
											disabled={noPattern || isSubmitting}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
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
