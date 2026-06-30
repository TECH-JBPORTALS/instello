"use client";

import { api } from "@instello/convex/api";
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
import { useInsMutation } from "@/hooks/convex-react";
import { useAppForm } from "@/hooks/form";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { AddFacultyStepIndicator } from "../forms/add-faculty-step-indicator";
import { ContactStep } from "../forms/contact-step";
import { EmploymentStep } from "../forms/employment-step";
import { PersonalInfoStep } from "../forms/personal-info-step";
import {
	addFacultyFormOpt,
	ContactSchema,
	EmploymentSchema,
	PersonalInfoSchema,
} from "../forms/shared-form";

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
	const createFaculty = useInsMutation(api.faculty.create);

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
				await createFaculty({
					staffId: value.employment.staffId,
					firstName: value.personalInfo.firstName,
					lastName: value.personalInfo.lastName,
					dateOfBirth: value.personalInfo.dateOfBirth,
					email: value.personalInfo.email,
					profilePicUrl: value.personalInfo.profilePicUrl || undefined,
					designation: value.employment.designation,
					joinedDate: value.employment.joinedDate
						? new Date(value.employment.joinedDate).getTime()
						: undefined,
					qualification: value.employment.qualification,
					specialization: value.employment.specialization,
					phoneNumber: value.contact.phoneNumber,
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

				<AddFacultyStepIndicator step={step} />

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
