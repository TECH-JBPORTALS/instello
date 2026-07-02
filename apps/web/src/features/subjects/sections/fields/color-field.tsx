"use client";

import { api } from "@instello/convex/api";
import { Spinner } from "@instello/ui/components/spinner";
import { useState } from "react";
import { useInsMutation } from "@/hooks/convex-react";
import { getConvexErrorMessage } from "@/lib/convex-error";
import { SubjectColorField } from "../../forms/subject-color-field";
import type { SubjectFieldProps } from "./types";

export function ColorField({ subjectId, savedValue }: SubjectFieldProps) {
	const updateColor = useInsMutation(api.subjects.updateColor);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const handleChange = async (color: string) => {
		if (color.toLowerCase() === savedValue.toLowerCase()) return;

		setSubmitError(null);
		setIsSaving(true);

		try {
			await updateColor({ id: subjectId, body: { color } });
		} catch (error) {
			setSubmitError(getConvexErrorMessage(error, "Failed to save color"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-1">
			<div className="relative">
				<SubjectColorField value={savedValue} onChange={handleChange} />
				{isSaving && (
					<div className="absolute inset-y-0 -left-6 flex items-center">
						<Spinner className="size-4 text-muted-foreground" />
					</div>
				)}
			</div>
			{submitError && (
				<p className="text-xs text-destructive" role="alert">
					{submitError}
				</p>
			)}
		</div>
	);
}
