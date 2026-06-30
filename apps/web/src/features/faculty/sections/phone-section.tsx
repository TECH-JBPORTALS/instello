"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Button } from "@instello/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import { revalidateLogic } from "@tanstack/react-form-nextjs";
import { useState } from "react";
import { useInsMutation } from "@/hooks/convex-react";
import { useAppForm } from "@/hooks/form";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { cn } from "@/lib/utils";
import { PatchPhoneSchema } from "../forms/shared-form";

type PhoneSectionProps = {
	faculty: {
		_id: Id<"faculty">;
		phone: {
			number: string;
			verified: boolean;
		};
	};
	disabled?: boolean;
};

export function PhoneSection({ faculty, disabled }: PhoneSectionProps) {
	const updatePhoneNumber = useInsMutation(api.faculty.updatePhoneNumber);
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			number: faculty.phone.number,
		},
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: PatchPhoneSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await updatePhoneNumber({
					id: faculty._id,
					body: value,
				});
			} catch (submitError) {
				setError(
					getConvexErrorMessage(submitError, "Failed to update phone number"),
				);
			}
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Phone</CardTitle>
				<CardDescription>
					Contact number for this faculty member.
				</CardDescription>
			</CardHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					void form.handleSubmit();
				}}
			>
				<CardContent>
					<FieldGroup>
						<form.Field
							name="number"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
										<Input
											id={field.name}
											type="tel"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={disabled}
											aria-invalid={isInvalid}
										/>
										<FieldDescription className="flex items-center gap-2">
											<span
												className={cn(
													"inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
													faculty.phone.verified
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground",
												)}
											>
												{faculty.phone.verified ? "Verified" : "Not verified"}
											</span>
											Changing the number will reset verification.
										</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>
					</FieldGroup>

					{error && <p className="mt-4 text-sm text-destructive">{error}</p>}
				</CardContent>
				{!disabled && (
					<CardFooter className="justify-end border-t">
						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<Button type="submit" disabled={isSubmitting}>
									Save changes
								</Button>
							)}
						</form.Subscribe>
					</CardFooter>
				)}
			</form>
		</Card>
	);
}
