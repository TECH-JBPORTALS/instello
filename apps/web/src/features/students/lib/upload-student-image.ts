import type { Doc } from "@instello/convex/dataModel";

export const STUDENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export async function uploadStudentImage(
	generateUploadUrl: () => Promise<string>,
	file: File,
): Promise<NonNullable<Doc<"students">["image"]>> {
	if (!file.type.startsWith("image/")) {
		throw new Error("Please select an image file");
	}

	if (file.size > STUDENT_IMAGE_MAX_BYTES) {
		throw new Error("Image must be 5MB or smaller");
	}

	const uploadUrl = await generateUploadUrl();
	const result = await fetch(uploadUrl, {
		method: "POST",
		headers: { "Content-Type": file.type },
		body: file,
	});

	if (!result.ok) {
		throw new Error("Failed to upload image");
	}

	const { storageId } = (await result.json()) as {
		storageId: NonNullable<Doc<"students">["image"]>;
	};
	return storageId;
}
