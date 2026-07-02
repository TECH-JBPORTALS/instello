"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { useEffect, useState } from "react";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { FacultyImageUploadField } from "../../forms/faculty-image-upload-field";
import { uploadFacultyImage } from "../../lib/upload-faculty-image";

type FacultyImageFieldProps = {
	facultyId: Id<"faculty">;
	firstName: string;
	lastName: string;
	savedImageUrl?: string;
};

export function FacultyImageField({
	facultyId,
	firstName,
	lastName,
	savedImageUrl,
}: FacultyImageFieldProps) {
	const updatePersonalInfo = useInsMutation(api.faculty.updatePersonalInfo);
	const generateImageUploadUrl = useInsMutation(
		api.faculty.generateImageUploadUrl,
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
			const storageId = await uploadFacultyImage(
				() => generateImageUploadUrl({}),
				file,
			);
			await updatePersonalInfo({
				id: facultyId,
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
				id: facultyId,
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
			<FacultyImageUploadField
				hideLabel
				id={`faculty-image-${facultyId}`}
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
