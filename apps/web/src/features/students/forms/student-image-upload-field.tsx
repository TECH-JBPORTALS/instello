"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@instello/ui/components/field";
import { IconTrash, IconUpload } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { STUDENT_IMAGE_MAX_BYTES } from "../lib/upload-student-image";
import { getStudentInitials } from "./shared-form";

type StudentImageUploadFieldProps = {
	id: string;
	firstName: string;
	lastName: string;
	file?: File | null;
	previewUrl?: string;
	isInvalid?: boolean;
	errors?: Parameters<typeof FieldError>[0]["errors"];
	onFileSelect: (file: File) => void;
	onRemove: () => void;
	hideLabel?: boolean;
};

function useBlobPreviewUrl(file: File | null | undefined) {
	const [url, setUrl] = useState<string | undefined>();

	useEffect(() => {
		if (!file) {
			setUrl(undefined);
			return;
		}

		const objectUrl = URL.createObjectURL(file);
		setUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [file]);

	return url;
}

export function StudentImageUploadField({
	id,
	firstName,
	lastName,
	file,
	previewUrl,
	isInvalid = false,
	errors,
	onFileSelect,
	onRemove,
	hideLabel = false,
}: StudentImageUploadFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const blobPreviewUrl = useBlobPreviewUrl(file);
	const displayPreviewUrl = previewUrl ?? blobPreviewUrl;

	const handleFileSelect = (file: File | undefined) => {
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setFileError("Please select an image file");
			return;
		}

		if (file.size > STUDENT_IMAGE_MAX_BYTES) {
			setFileError("Image must be 5MB or smaller");
			return;
		}

		setFileError(null);
		onFileSelect(file);
	};

	return (
		<Field data-invalid={isInvalid || !!fileError}>
			{!hideLabel ? <FieldLabel htmlFor={id}>Profile photo</FieldLabel> : null}
			<div
				data-slot="student-avtar-wrapper"
				className="flex items-center gap-3.5"
			>
				<Avatar size="xl">
					{displayPreviewUrl ? (
						<AvatarImage src={displayPreviewUrl} alt="Profile photo" />
					) : null}
					<AvatarFallback>
						{getStudentInitials(firstName, lastName)}
					</AvatarFallback>
				</Avatar>
				<div className="flex gap-2">
					<input
						ref={inputRef}
						id={id}
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={(event) => handleFileSelect(event.target.files?.[0])}
					/>
					{displayPreviewUrl ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onRemove}
						>
							<IconTrash />
							Remove
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => inputRef.current?.click()}
						>
							<IconUpload />
							Upload
						</Button>
					)}
				</div>
			</div>
			{fileError && <FieldError errors={[{ message: fileError }]} />}
			{isInvalid && !fileError && errors ? (
				<FieldError errors={errors} />
			) : null}

			{!hideLabel && (
				<FieldDescription>
					Optional. Recommended size 256x256px (max 5MB)
				</FieldDescription>
			)}
		</Field>
	);
}
