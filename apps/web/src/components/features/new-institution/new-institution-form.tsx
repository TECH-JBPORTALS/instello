"use client";

import { authClient } from "@instello/convex/better-auth/client";
import {
	BrowserMockup,
	BrowserMockupContent,
	BrowserMockupHeader,
} from "@instello/ui/components/browser-mockup";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
import { revalidateLogic } from "@tanstack/react-form-nextjs";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import * as v from "valibot";
import { useAppForm } from "@/hooks/form";
import { protocol, rootDomain } from "@/lib/utils";
import { AddressForm } from "./address-form";
import { BasicInfoForm } from "./basic-info-form";
import {
	getInstitutionPreviewUrl,
	InstitutionPreview,
} from "./institution-preview";
import {
	AddressSchema,
	BasicInfoSchema,
	newInstitutionFormOpt,
} from "./shared-form";

export function NewInstitutionForm() {
	const [step, setStep] = useState(0);
	const [globalError, setGlobalError] = useState<string | null>(null);

	const form = useAppForm({
		...newInstitutionFormOpt,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: v.object({
				basicInfo: BasicInfoSchema,
				address: AddressSchema,
			}),
		},
		asyncDebounceMs: 2000,
		onSubmit: async ({ value }) => {
			setGlobalError(null);
			const { basicInfo, address } = value;

			const { error } = await authClient.organization.create({
				name: basicInfo.name,
				slug: basicInfo.slug,
				logo: basicInfo.logo || undefined,
				code: basicInfo.code,
				addressLine: address.addressLine,
				district: address.district,
				state: address.state,
				zipCode: address.zipCode,
			});

			if (error) {
				setGlobalError(error.message ?? "Failed to create institution");
				return;
			}

			window.location.href = `${protocol}://${basicInfo.slug.trim()}.${rootDomain}`;
		},
	});

	return (
		<div className="flex flex-row items-stretch gap-16 rounded-2xl border bg-card p-8 xl:p-12 xl:pr-0">
			<div className="flex min-w-sm flex-col">
				{globalError && (
					<Alert variant="destructive" className="mb-4">
						<IconAlertCircle />
						<AlertTitle>{globalError}</AlertTitle>
						<AlertDescription>
							Review the form and try again.
						</AlertDescription>
					</Alert>
				)}
				{step === 0 && (
					<BasicInfoForm form={form} setStep={setStep} step={step} />
				)}
				{step === 1 && (
					<AddressForm form={form} setStep={setStep} step={step} />
				)}
			</div>

			<form.Subscribe selector={(state) => state.values}>
				{(values) => (
					<BrowserMockup className="hidden xl:flex">
						<BrowserMockupHeader
							searchInputText={getInstitutionPreviewUrl(values.basicInfo.slug)}
						/>
						<BrowserMockupContent>
							<InstitutionPreview values={values} />
						</BrowserMockupContent>
					</BrowserMockup>
				)}
			</form.Subscribe>
		</div>
	);
}
