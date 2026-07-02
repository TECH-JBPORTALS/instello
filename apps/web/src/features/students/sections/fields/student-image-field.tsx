"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { useEffect, useState } from "react";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { StudentImageUploadField } from "../../forms/student-image-upload-field";
import { uploadStudentImage } from "../../lib/upload-student-image";

type StudentImageFieldProps = {
	studentId: Id<"students">;
	firstName: string;
	lastName: string;
	savedImageUrl?: string;
};

export function StudentImageField({
	studentId,
	firstName,
	lastName,
	savedImageUrl,
}: StudentImageFieldProps) {
	const updatePersonalInfo = useInsMutation(api.students.updatePersonalInfo);
	const generateImageUploadUrl = useInsMutation(
		api.students.generateImageUploadUrl,
	);
	const [previewUrl, setPreviewUrl] = useState<string | undefined>(
		savedImageUrl,
	);
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		setPreviewUrl(savedImageUrl);
	}, [savedImageUrl]);

	const handleFileSelect = async (file: File) => {
		setError(null);
		setIsUploading(true);

		try {
			const storageId = await uploadStudentImage(
				() => generateImageUploadUrl({}),
				file,
			);
			await updatePersonalInfo({
				id: studentId,
				body: { image: storageId },
			});
			setPreviewUrl(URL.createObjectURL(file));
		} catch (uploadError) {
			setError(getConvexErrorMessage(uploadError, "Failed to upload image"));
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemove = async () => {
		setError(null);
		setIsUploading(true);

		try {
			await updatePersonalInfo({
				id: studentId,
				body: { image: null },
			});
			setPreviewUrl(undefined);
		} catch (removeError) {
			setError(getConvexErrorMessage(removeError, "Failed to remove image"));
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="mt-3 space-y-2">
			<StudentImageUploadField
				hideLabel
				id={`student-image-${studentId}`}
				firstName={firstName}
				lastName={lastName}
				previewUrl={previewUrl}
				onFileSelect={(file) => {
					void handleFileSelect(file);
				}}
				onRemove={() => {
					void handleRemove();
				}}
			/>
			{isUploading && (
				<p className="text-xs text-muted-foreground">Uploading…</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
