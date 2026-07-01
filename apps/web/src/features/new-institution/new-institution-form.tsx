"use client";

import { api } from "@instello/convex/api";
import { authClient } from "@instello/convex/better-auth/client";
import type { Id } from "@instello/convex/dataModel";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
import {
	BrowserMockup,
	BrowserMockupContent,
	BrowserMockupHeader,
} from "@instello/ui/components/browser-mockup";
import { IconAlertCircle } from "@tabler/icons-react";
import { revalidateLogic } from "@tanstack/react-form-nextjs";
import { useConvex, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
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
import { PatternForm } from "./pattern-form";
import {
	AddressSchema,
	BasicInfoSchema,
	newInstitutionFormOpt,
	PatternSchema,
} from "./shared-form";

export function NewInstitutionForm() {
	const [step, setStep] = useState(0);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const convex = useConvex();
	const adoptPattern = useMutation(api.academicPatterns.adopt);

	const form = useAppForm({
		...newInstitutionFormOpt,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: v.object({
				basicInfo: BasicInfoSchema,
				address: AddressSchema,
				pattern: PatternSchema,
			}),
		},
		asyncDebounceMs: 2000,
		onSubmit: async ({ value }) => {
			setGlobalError(null);
			const { basicInfo, address, pattern } = value;
			const slug = basicInfo.slug.trim();

			const { data, error } = await authClient.organization.create({
				name: basicInfo.name,
				slug,
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

			const institutionId =
				data?.id ??
				(
					await convex.query(api.institutions.getBySlug, {
						slug,
					})
				)._id;

			try {
				await adoptPattern({
					institutionId,
					academicPatternId:
						pattern.academicPatternId as Id<"academicPatterns">,
				});
			} catch (adoptError) {
				setGlobalError(
					adoptError instanceof ConvexError
						? `Institution created, but pattern adoption failed: ${adoptError.data.message}`
						: "Institution created, but pattern adoption failed. Try again from institution settings.",
				);
				return;
			}

			window.location.href = `${protocol}://${slug}.${rootDomain}`;
		},
	});

	return (
		<div className="flex flex-row items-stretch gap-16 rounded-2xl border bg-card p-8 xl:p-12 xl:pr-0">
			<div className="flex min-w-sm flex-col">
				{globalError && (
					<Alert variant="destructive" className="mb-4">
						<IconAlertCircle />
						<AlertTitle>{globalError}</AlertTitle>
						<AlertDescription>Review the form and try again.</AlertDescription>
					</Alert>
				)}
				{step === 0 && (
					<BasicInfoForm form={form} setStep={setStep} step={step} />
				)}
				{step === 1 && (
					<AddressForm form={form} setStep={setStep} step={step} />
				)}
				{step === 2 && (
					<PatternForm form={form} setStep={setStep} step={step} />
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
