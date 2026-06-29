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
import { revalidateLogic } from "@tanstack/react-form-nextjs";
import { useMutation } from "convex/react";
import { useState } from "react";
import { INDIAN_STATES } from "@/features/new-institution/shared-form";
import { useAppForm } from "@/hooks/form";
import { PatchAddressSchema } from "../forms/shared-form";

type AddressSectionProps = {
	faculty: {
		_id: Id<"faculty">;
		addressLine: string;
		district: string;
		state: string;
		country: string;
		zipCode: string;
	};
	disabled?: boolean;
};

export function AddressSection({ faculty, disabled }: AddressSectionProps) {
	const updateAddress = useMutation(api.faculty.updateAddress);
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			addressLine: faculty.addressLine,
			district: faculty.district,
			state: faculty.state,
			country: faculty.country,
			zipCode: faculty.zipCode,
		},
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: PatchAddressSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await updateAddress({
					id: faculty._id,
					body: value,
				});
			} catch (submitError) {
				setError(
					submitError instanceof Error
						? submitError.message
						: "Failed to update address",
				);
			}
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Address</CardTitle>
				<CardDescription>
					Residential address for this faculty member.
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
							name="addressLine"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Street address</FieldLabel>
										<Textarea
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={disabled}
											aria-invalid={isInvalid}
											rows={3}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="district"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>District</FieldLabel>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={disabled}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field
								name="state"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>State</FieldLabel>
											<Select
												value={field.state.value || null}
												onValueChange={(value) => {
													field.handleChange(value ?? "");
													field.handleBlur();
												}}
												disabled={disabled}
											>
												<SelectTrigger
													id={field.name}
													className="w-full"
													aria-invalid={isInvalid}
												>
													<SelectValue placeholder="Select state" />
												</SelectTrigger>
												<SelectContent>
													{INDIAN_STATES.map((state) => (
														<SelectItem key={state} value={state}>
															{state}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>

							<form.Field
								name="zipCode"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>PIN code</FieldLabel>
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={disabled}
												aria-invalid={isInvalid}
												inputMode="numeric"
												maxLength={6}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>
						</div>

						<form.Field
							name="country"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Country</FieldLabel>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={disabled}
											aria-invalid={isInvalid}
										/>
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
