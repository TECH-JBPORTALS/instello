"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import * as v from "valibot";
import { InlineTextField } from "@/features/students/sections/fields/inline-text-field";
import { useInsMutation } from "@/hooks/convex-react";

type ProgramFieldProps = {
	programId: Id<"programs">;
	savedValue: string;
};

export function ProgramNameField({ programId, savedValue }: ProgramFieldProps) {
	const update = useInsMutation(api.program.mutations.updateName);

	return (
		<InlineTextField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({
				name: v.pipe(v.string(), v.nonEmpty("Program name is required")),
			})}
			onSave={async (name) => {
				await update({ id: programId, body: { name } });
			}}
			placeholder="eg. Aerospace Engineering"
		/>
	);
}

export function ProgramAliasField({
	programId,
	savedValue,
}: ProgramFieldProps) {
	const update = useInsMutation(api.program.mutations.updateAlias);

	return (
		<InlineTextField
			fieldName="alias"
			savedValue={savedValue}
			validator={v.object({
				alias: v.pipe(
					v.string(),
					v.nonEmpty("Program alias is required"),
					v.slug("Allowed only alphanumeric characters and hyphens"),
				),
			})}
			onSave={async (alias) => {
				await update({ id: programId, body: { alias } });
			}}
			placeholder="eg. ae"
		/>
	);
}
