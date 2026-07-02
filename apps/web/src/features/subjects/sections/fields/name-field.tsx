"use client";

import { api } from "@instello/convex/api";
import * as v from "valibot";
import { useInsMutation } from "@/hooks/convex-react";
import { InlineSubjectTextField } from "./inline-subject-text-field";
import type { SubjectFieldProps } from "./types";

export function NameField({ subjectId, savedValue }: SubjectFieldProps) {
	const update = useInsMutation(api.subjects.updateName);

	return (
		<InlineSubjectTextField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({
				name: v.pipe(v.string(), v.nonEmpty("Subject name is required")),
			})}
			onSave={async (name) => {
				await update({ id: subjectId, body: { name } });
			}}
			placeholder="eg. Applied Science"
		/>
	);
}
