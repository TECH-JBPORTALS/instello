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
import { useMutation } from "convex/react";
import { useState } from "react";
import * as v from "valibot";
import { InlineTextField } from "@/components/common/inline-text-field";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { INDIAN_STATES } from "@/lib/indian-states";

function useUpdateOwnerOrg() {
	return useMutation(api.ownerOrganizations.update);
}

export function OwnerNameField({ savedValue }: { savedValue: string }) {
	const update = useUpdateOwnerOrg();

	return (
		<InlineTextField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({
				name: v.pipe(v.string(), v.nonEmpty("Organization name is required")),
			})}
			onSave={async (name) => {
				await update({ body: { name } });
			}}
		/>
	);
}

export function OwnerAddressLineField({ savedValue }: { savedValue: string }) {
	const update = useUpdateOwnerOrg();

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

export function OwnerCityField({ savedValue }: { savedValue: string }) {
	const update = useUpdateOwnerOrg();

	return (
		<InlineTextField
			fieldName="city"
			savedValue={savedValue}
			validator={v.object({
				city: v.pipe(v.string(), v.nonEmpty("City is required")),
			})}
			onSave={async (city) => {
				await update({ body: { city } });
			}}
		/>
	);
}

export function OwnerPostalCodeField({ savedValue }: { savedValue: string }) {
	const update = useUpdateOwnerOrg();

	return (
		<InlineTextField
			fieldName="postalCode"
			savedValue={savedValue}
			validator={v.object({
				postalCode: v.pipe(
					v.string(),
					v.nonEmpty("Postal code is required"),
					v.minLength(6, "Invalid postal code"),
					v.maxLength(6, "Invalid postal code"),
				),
			})}
			onSave={async (postalCode) => {
				await update({ body: { postalCode } });
			}}
		/>
	);
}

export function OwnerCountryField({ savedValue }: { savedValue: string }) {
	const update = useUpdateOwnerOrg();

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

export function OwnerStateField({ savedValue }: { savedValue: string }) {
	const update = useUpdateOwnerOrg();
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
