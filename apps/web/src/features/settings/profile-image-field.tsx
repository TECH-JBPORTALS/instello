"use client";

import { api } from "@instello/convex/api";
import { authClient } from "@instello/convex/better-auth/client";
import type { Id } from "@instello/convex/dataModel";
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
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { uploadProfileImage } from "./lib/upload-profile-image";
import { getInitials } from "./shared-form";

type ProfileImageFieldProps = {
	name: string;
	imageUrl?: string | null;
};

export function ProfileImageField({ name, imageUrl }: ProfileImageFieldProps) {
	const generateUploadUrl = useMutation(
		api.users.generateProfileImageUploadUrl,
	);
	const resolveStorageUrl = useMutation(api.users.resolveStorageUrl);
	const inputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | undefined>(
		imageUrl ?? undefined,
	);
	const [fileError, setFileError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		setPreviewUrl(imageUrl ?? undefined);
	}, [imageUrl]);

	const handleFileSelect = async (file: File) => {
		setFileError(null);
		setIsUploading(true);

		try {
			const storageId = await uploadProfileImage(
				() => generateUploadUrl({}),
				file,
			);
			const url = await resolveStorageUrl({
				storageId: storageId as Id<"_storage">,
			});
			const { error } = await authClient.updateUser({ image: url });

			if (error) {
				throw new Error(error.message ?? "Failed to update profile image");
			}

			setPreviewUrl(URL.createObjectURL(file));
		} catch (uploadError) {
			setFileError(
				getConvexErrorMessage(uploadError, "Failed to upload image"),
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemove = async () => {
		setFileError(null);
		setIsUploading(true);

		try {
			const { error } = await authClient.updateUser({ image: null });

			if (error) {
				throw new Error(error.message ?? "Failed to remove profile image");
			}

			setPreviewUrl(undefined);
		} catch (removeError) {
			setFileError(
				getConvexErrorMessage(removeError, "Failed to remove image"),
			);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Field data-invalid={!!fileError}>
			<FieldLabel htmlFor="profile-image">Profile photo</FieldLabel>
			<div className="flex items-center gap-3.5">
				<Avatar size="xl">
					{previewUrl ? (
						<AvatarImage src={previewUrl} alt="Profile photo" />
					) : null}
					<AvatarFallback>{getInitials(name || "?")}</AvatarFallback>
				</Avatar>
				<div className="flex gap-2">
					<input
						ref={inputRef}
						id="profile-image"
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) void handleFileSelect(file);
							event.target.value = "";
						}}
					/>
					{previewUrl ? (
						<>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={isUploading}
								onClick={() => inputRef.current?.click()}
							>
								<IconUpload />
								Re-upload
							</Button>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								disabled={isUploading}
								onClick={() => {
									void handleRemove();
								}}
							>
								<IconTrash />
								Remove
							</Button>
						</>
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isUploading}
							onClick={() => inputRef.current?.click()}
						>
							<IconUpload />
							Upload
						</Button>
					)}
				</div>
			</div>
			{isUploading && (
				<p className="text-xs text-muted-foreground">Uploading…</p>
			)}
			{fileError && <FieldError errors={[{ message: fileError }]} />}
			<FieldDescription>Recommended size 256x256px (max 5MB)</FieldDescription>
		</Field>
	);
}
