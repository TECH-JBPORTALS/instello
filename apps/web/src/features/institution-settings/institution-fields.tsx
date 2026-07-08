"use client";

import { api } from "@instello/convex/api";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Spinner } from "@instello/ui/components/spinner";
import { useState } from "react";
import * as v from "valibot";
import { InlineTextField } from "@/features/students/sections/fields/inline-text-field";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { INDIAN_STATES } from "@/lib/indian-states";

function useUpdateInstitution() {
	return useInsMutation(api.institutions.update);
}

export function InstitutionNameField({ savedValue }: { savedValue: string }) {
	const update = useUpdateInstitution();

	return (
		<InlineTextField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({
				name: v.pipe(v.string(), v.nonEmpty("Institution name is required")),
			})}
			onSave={async (name) => {
				await update({ body: { name } });
			}}
		/>
	);
}

export function InstitutionAddressLineField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineTextField
			fieldName="addressLine"
			savedValue={savedValue}
			validator={v.object({
				addressLine: v.pipe(v.string(), v.nonEmpty("Address is required")),
			})}
			onSave={async (addressLine) => {
				await update({ body: { addressLine } });
			}}
		/>
	);
}

export function InstitutionDistrictField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineTextField
			fieldName="district"
			savedValue={savedValue}
			validator={v.object({
				district: v.pipe(v.string(), v.nonEmpty("District is required")),
			})}
			onSave={async (district) => {
				await update({ body: { district } });
			}}
		/>
	);
}

export function InstitutionZipCodeField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineTextField
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
		/>
	);
}

export function InstitutionCountryField({
	savedValue,
}: {
	savedValue: string;
}) {
	const update = useUpdateInstitution();

	return (
		<InlineTextField
			fieldName="country"
			savedValue={savedValue}
			validator={v.object({
				country: v.pipe(v.string(), v.nonEmpty("Country is required")),
			})}
			onSave={async (country) => {
				await update({ body: { country } });
			}}
		/>
	);
}

export function InstitutionStateField({ savedValue }: { savedValue: string }) {
	const update = useUpdateInstitution();
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	return (
		<div className="flex flex-col items-end gap-1">
			<Select
				value={savedValue}
				disabled={isSaving}
				onValueChange={(value) => {
					if (!value || value === savedValue) return;
					setError(null);
					setIsSaving(true);
					void update({ body: { state: value } })
						.catch((saveError) => {
							setError(
								getConvexErrorMessage(saveError, "Failed to save state"),
							);
						})
						.finally(() => {
							setIsSaving(false);
						});
				}}
			>
				<SelectTrigger size="sm" className="min-w-44">
					{isSaving ? (
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
			{error && (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
