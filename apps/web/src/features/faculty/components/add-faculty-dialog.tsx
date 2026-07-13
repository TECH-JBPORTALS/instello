"use client";

import { api } from "@instello/convex/api";
import type { Doc } from "@instello/convex/dataModel";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@instello/ui/components/dialog";
import { IconAlertCircle } from "@tabler/icons-react";
import { revalidateLogic } from "@tanstack/react-form-nextjs";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { MultiStepIndicator } from "@/components/common/multi-step-indicator";
import { useInsMutation } from "@/hooks/convex-react";
import { useAppForm } from "@/hooks/form";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { formatIndianPhoneNumberForStorage } from "@/lib/phone";
import { ADD_FACULTY_STEPS } from "../constants";
import { ContactStep } from "../forms/contact-step";
import { EmploymentStep } from "../forms/employment-step";
import { PersonalInfoStep } from "../forms/personal-info-step";
import {
	addFacultyFormOpt,
	ContactSchema,
	EmploymentSchema,
	PersonalInfoSchema,
} from "../forms/shared-form";
import { uploadFacultyImage } from "../lib/upload-faculty-image";

type AddFacultyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function AddFacultyDialog({
	open,
	onOpenChange,
}: AddFacultyDialogProps) {
	const [step, setStep] = useState(0);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const createFaculty = useInsMutation(api.faculty.mutations.create);
	const generateImageUploadUrl = useInsMutation(
		api.faculty.mutations.generateImageUploadUrl,
	);

	const form = useAppForm({
		...addFacultyFormOpt,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: v.object({
				personalInfo: PersonalInfoSchema,
				employment: EmploymentSchema,
				contact: ContactSchema,
			}),
		},
		onSubmit: async ({ value }) => {
			setGlobalError(null);

			try {
				let image: Doc<"faculty">["image"];

				if (value.personalInfo.imageFile) {
					image = await uploadFacultyImage(
						() => generateImageUploadUrl({}),
						value.personalInfo.imageFile,
					);
				}

				await createFaculty({
					staffId: value.employment.staffId,
					firstName: value.personalInfo.firstName,
					lastName: value.personalInfo.lastName,
					dateOfBirth: value.personalInfo.dateOfBirth,
					email: value.personalInfo.email,
					image,
					designation: value.employment.designation,
					joinedDate: value.employment.joinedDate
						? new Date(value.employment.joinedDate).getTime()
						: undefined,
					qualification: value.employment.qualification,
					specialization: value.employment.specialization,
					phoneNumber: formatIndianPhoneNumberForStorage(
						value.contact.phoneNumber,
					),
				});
				onOpenChange(false);
			} catch (error) {
				setGlobalError(
					getConvexErrorMessage(error, "Failed to create faculty"),
				);
			}
		},
	});

	useEffect(() => {
		if (!open) {
			setStep(0);
			setGlobalError(null);
			form.reset();
		}
	}, [open, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add staff member</DialogTitle>
					<DialogDescription>
						Enter the faculty member&apos;s details across the steps below.
					</DialogDescription>
				</DialogHeader>

				<MultiStepIndicator step={step} steps={ADD_FACULTY_STEPS} />

				{globalError && (
					<Alert variant="destructive">
						<IconAlertCircle />
						<AlertTitle>Could not add staff</AlertTitle>
						<AlertDescription>{globalError}</AlertDescription>
					</Alert>
				)}

				{step === 0 && (
					<PersonalInfoStep form={form} setStep={setStep} step={step} />
				)}
				{step === 1 && (
					<EmploymentStep form={form} setStep={setStep} step={step} />
				)}
				{step === 2 && (
					<ContactStep form={form} setStep={setStep} step={step} />
				)}
			</DialogContent>
		</Dialog>
	);
}
