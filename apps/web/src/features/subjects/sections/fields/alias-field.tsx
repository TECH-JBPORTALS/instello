"use client";

import { api } from "@instello/convex/api";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { useInsMutation } from "@/hooks/convex-react";
import { subjectPath } from "../../subject-path";
import { InlineSubjectTextField } from "./inline-subject-text-field";
import type { SubjectFieldProps } from "./types";

export function AliasField({ subjectId, savedValue }: SubjectFieldProps) {
	const update = useInsMutation(api.subjects.updateAlias);
	const router = useRouter();

	return (
		<InlineSubjectTextField
			fieldName="alias"
			savedValue={savedValue}
			validator={v.object({
				alias: v.pipe(
					v.string(),
					v.nonEmpty("Subject alias is required"),
					v.slug("Allowed only alphanumeric characters and hyphens"),
				),
			})}
			onSave={async (alias) => {
				await update({ id: subjectId, body: { alias } }).then(() =>
					router.replace(subjectPath(alias)),
				);
			}}
			placeholder="eg. applied-science"
		/>
	);
}
