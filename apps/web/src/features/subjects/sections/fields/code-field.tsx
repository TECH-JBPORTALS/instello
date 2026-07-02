"use client";

import { api } from "@instello/convex/api";
import * as v from "valibot";
import { useInsMutation } from "@/hooks/convex-react";
import { InlineSubjectTextField } from "./inline-subject-text-field";
import type { SubjectFieldProps } from "./types";

export function CodeField({ subjectId, savedValue }: SubjectFieldProps) {
	const update = useInsMutation(api.subjects.updateCode);

	return (
		<InlineSubjectTextField
			fieldName="code"
			savedValue={savedValue}
			validator={v.object({
				code: v.pipe(
					v.string(),
					v.nonEmpty("Subject code is required"),
					v.regex(
						/^[A-Za-z0-9-]+$/,
						"Allowed only alphanumeric characters and hyphens",
					),
				),
			})}
			onSave={async (code) => {
				await update({ id: subjectId, body: { code } });
			}}
			placeholder="eg. 15CSE09T"
			inputClassName="uppercase"
		/>
	);
}
