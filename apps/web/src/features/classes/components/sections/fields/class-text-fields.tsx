"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import * as v from "valibot";
import { InlineTextField } from "@/features/students/sections/fields/inline-text-field";
import { useInsMutation } from "@/hooks/convex-react";

export type ClassFieldProps = {
	classId: Id<"classes">;
	savedValue: string;
};

export function ClassNameField({ classId, savedValue }: ClassFieldProps) {
	const update = useInsMutation(api.class.mutations.updateBasicInfo);

	return (
		<InlineTextField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({
				name: v.pipe(v.string(), v.nonEmpty("Name is required")),
			})}
			onSave={async (name) => {
				await update({ id: classId, body: { name } });
			}}
		/>
	);
}

export function ClassDescriptionField({
	classId,
	savedValue,
}: ClassFieldProps) {
	const update = useInsMutation(api.class.mutations.updateBasicInfo);

	return (
		<InlineTextField
			fieldName="description"
			savedValue={savedValue}
			placeholder="Add a description"
			validator={v.object({
				description: v.string(),
			})}
			onSave={async (description) => {
				await update({ id: classId, body: { description } });
			}}
		/>
	);
}
