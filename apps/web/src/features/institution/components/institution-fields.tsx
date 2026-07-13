"use client";

import { api } from "@instello/convex/api";
import { FieldError } from "@instello/ui/components/field";
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
import { Spinner } from "@instello/ui/components/spinner";
import * as v from "valibot";
import {
	InlineFormField,
	type InlineFormFieldRenderProps,
} from "@/components/common/inline-form-field";
import { useInsMutation } from "@/hooks/convex-react";
import { INDIAN_STATES } from "@/lib/indian-states";

function useUpdateInstitution() {
	return useInsMutation(api.institution.mutations.update);
}

function renderTextControl(
	field: InlineFormFieldRenderProps<string>,
	placeholder?: string,
) {
	return (
		<>
			<InputGroup className="min-w-3xs">
				{field.isSubmitting && (
					<InputGroupAddon align="inline-start">
						<Spinner className="size-4 text-muted-foreground" />
					</InputGroupAddon>
				)}
				<InputGroupInput
					value={field.value}
					onChange={(event) => field.onChange(event.target.value)}
					onBlur={field.onBlur}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							field.onEscape();
						}
					}}
					disabled={field.isSubmitting}
					placeholder={placeholder}
					aria-invalid={field.isInvalid}
				/>
			</InputGroup>
			{field.isInvalid && <FieldError errors={field.errors} />}
		</>
	);
}

export function InstitutionNameField({ savedValue }: { savedValue: string }) {
	const update = useUpdateInstitution();

	return (
		<InlineFormField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({
				name: v.pipe(v.string(), v.nonEmpty("Institution name is required")),
			})}
			onSave={async (name) => {
				await update({ body: { name } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function InstitutionAddressLineField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineFormField
			fieldName="addressLine"
			savedValue={savedValue}
			validator={v.object({
				addressLine: v.pipe(v.string(), v.nonEmpty("Address is required")),
			})}
			onSave={async (addressLine) => {
				await update({ body: { addressLine } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function InstitutionDistrictField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineFormField
			fieldName="district"
			savedValue={savedValue}
			validator={v.object({
				district: v.pipe(v.string(), v.nonEmpty("District is required")),
			})}
			onSave={async (district) => {
				await update({ body: { district } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function InstitutionZipCodeField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineFormField
			fieldName="zipCode"
			savedValue={savedValue}
			validator={v.object({
				zipCode: v.pipe(
					v.string(),
					v.nonEmpty("Postal code is required"),
					v.minLength(6, "Invalid postal code"),
					v.maxLength(6, "Invalid postal code"),
				),
			})}
			onSave={async (zipCode) => {
				await update({ body: { zipCode } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function InstitutionCountryField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineFormField
			fieldName="country"
			savedValue={savedValue}
			validator={v.object({
				country: v.pipe(v.string(), v.nonEmpty("Country is required")),
			})}
			onSave={async (country) => {
				await update({ body: { country } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function InstitutionStateField({ savedValue }: { savedValue: string }) {
	const update = useUpdateInstitution();

	return (
		<InlineFormField
			fieldName="state"
			savedValue={savedValue}
			validator={v.object({
				state: v.pipe(v.string(), v.nonEmpty("State is required")),
			})}
			onSave={async (state) => {
				await update({ body: { state } });
			}}
			className="flex flex-col items-end gap-1"
		>
			{(field) => (
				<Select
					value={field.value}
					disabled={field.isSubmitting}
					onValueChange={(value) => {
						if (!value) return;
						field.onChange(value);
						field.submit();
					}}
				>
					<SelectTrigger size="sm" className="min-w-44">
						{field.isSubmitting ? (
							<Spinner className="size-4 text-muted-foreground" />
						) : null}
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
			)}
		</InlineFormField>
	);
}
