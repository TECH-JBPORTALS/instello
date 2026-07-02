"use client";

import { api } from "@instello/convex/api";
import type { Doc, Id } from "@instello/convex/dataModel";
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
import { MultiStepIndicator } from "@/components/common/multi-step-indicator";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { useAppForm } from "@/hooks/form";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { formatIndianPhoneNumberForStorage } from "@/lib/phone";
import { ADD_STUDENT_STEPS } from "../constants";
import { AcademicStep } from "../forms/academic-step";
import { ContactStep } from "../forms/contact-step";
import { PersonalInfoStep } from "../forms/personal-info-step";
import { addStudentFormOpt, CreateStudentSchema } from "../forms/shared-form";
import { uploadStudentImage } from "../lib/upload-student-image";

type NewStudentDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	classId: Id<"classes">;
};

export function NewStudentDialog({
	open,
	onOpenChange,
	classId,
}: NewStudentDialogProps) {
	const [step, setStep] = useState(0);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const createStudent = useInsMutation(api.students.create);
	const generateImageUploadUrl = useInsMutation(
		api.students.generateImageUploadUrl,
	);
	const categories = useInsQuery(
		api.students.listCategories,
		open ? {} : "skip",
	);

	const form = useAppForm({
		...addStudentFormOpt,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: CreateStudentSchema,
		},
		onSubmit: async ({ value }) => {
			setGlobalError(null);

			try {
				let image: Doc<"students">["image"];

				if (value.personalInfo.imageFile) {
					image = await uploadStudentImage(
						() => generateImageUploadUrl({}),
						value.personalInfo.imageFile,
					);
				}

				await createStudent({
					classId,
					firstName: value.personalInfo.firstName.trim(),
					lastName: value.personalInfo.lastName.trim(),
					usn: value.academic.usn.trim(),
					email: value.contact.email.trim(),
					gender: value.personalInfo.gender,
					categoryId: value.academic
						.categoryId as Id<"institutionStudentCategories">,
					phoneNumber: formatIndianPhoneNumberForStorage(
						value.contact.phoneNumber,
					),
					apaarId: value.academic.apaarId?.trim() || undefined,
					image,
				});
				onOpenChange(false);
			} catch (error) {
				setGlobalError(
					getConvexErrorMessage(error, "Failed to create student"),
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
					<DialogTitle>Add student</DialogTitle>
					<DialogDescription>
						Enter the student&apos;s details across the steps below.
					</DialogDescription>
				</DialogHeader>

				<MultiStepIndicator step={step} steps={ADD_STUDENT_STEPS} />

				{globalError && (
					<Alert variant="destructive">
						<IconAlertCircle />
						<AlertTitle>Could not add student</AlertTitle>
						<AlertDescription>{globalError}</AlertDescription>
					</Alert>
				)}

				{step === 0 && (
					<PersonalInfoStep form={form} setStep={setStep} step={step} />
				)}
				{step === 1 && (
					<ContactStep form={form} setStep={setStep} step={step} />
				)}
				{step === 2 && (
					<AcademicStep
						form={form}
						setStep={setStep}
						step={step}
						categories={categories ?? []}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
