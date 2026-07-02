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
import { useEffect, useState } from "react";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import {
	GENDER_LABELS,
	GENDER_OPTIONS,
	type GenderOption,
} from "../../constants";

export function GenderField({
	studentId,
	savedValue,
}: {
	studentId: Id<"students">;
	savedValue: GenderOption;
}) {
	const update = useInsMutation(api.students.updatePersonalInfo);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { gender: savedValue },
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			if (value.gender === savedValue) return;

			try {
				await update({ id: studentId, body: { gender: value.gender } });
				form.reset({ gender: value.gender });
			} catch (error) {
				form.reset({ gender: savedValue });
				setSubmitError(getConvexErrorMessage(error, "Failed to save gender"));
			}
		},
	});

	useEffect(() => {
		form.reset({ gender: savedValue });
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
					<form.Field name="gender">
						{(field) => (
							<div className="flex items-center gap-2">
								{isSubmitting && (
									<Spinner className="size-4 shrink-0 text-muted-foreground" />
								)}
								<Select
									value={field.state.value}
									onValueChange={(next) => {
										if (!next) return;
										field.handleChange(next as GenderOption);
										void form.handleSubmit();
									}}
									disabled={isSubmitting}
								>
									<SelectTrigger className="h-8 w-auto min-w-28 bg-transparent shadow-none hover:bg-accent/50">
										<SelectValue />
									</SelectTrigger>
									<SelectContent align="center">
										{GENDER_OPTIONS.map((option) => (
											<SelectItem key={option} value={option}>
												{GENDER_LABELS[option]}
											</SelectItem>
										))}
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

export function CategoryField({
	studentId,
	savedValue,
}: {
	studentId: Id<"students">;
	savedValue: Id<"institutionStudentCategories">;
}) {
	const update = useInsMutation(api.students.updateAcademicInfo);
	const categories = useInsQuery(api.students.listCategories, {});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { categoryId: savedValue },
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			if (value.categoryId === savedValue) return;

			try {
				await update({
					id: studentId,
					body: { categoryId: value.categoryId },
				});
				form.reset({ categoryId: value.categoryId });
			} catch (error) {
				form.reset({ categoryId: savedValue });
				setSubmitError(getConvexErrorMessage(error, "Failed to save category"));
			}
		},
	});

	useEffect(() => {
		form.reset({ categoryId: savedValue });
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
					<form.Field name="categoryId">
						{(field) => (
							<div className="flex items-center gap-2">
								{isSubmitting && (
									<Spinner className="size-4 shrink-0 text-muted-foreground" />
								)}
								<Select
									value={field.state.value}
									onValueChange={(next) => {
										if (!next) return;
										field.handleChange(
											next as Id<"institutionStudentCategories">,
										);
										void form.handleSubmit();
									}}
									disabled={isSubmitting}
								>
									<SelectTrigger className="h-8 w-auto min-w-28 bg-transparent shadow-none hover:bg-accent/50">
										<SelectValue />
									</SelectTrigger>
									<SelectContent align="center">
										{(categories ?? []).map((category) => (
											<SelectItem key={category._id} value={category._id}>
												{category.name}
											</SelectItem>
										))}
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
