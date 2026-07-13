"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { FieldError } from "@instello/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupTextarea,
} from "@instello/ui/components/input-group";
import { Kbd } from "@instello/ui/components/kbd";
import { Spinner } from "@instello/ui/components/spinner";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import {
	InlineFormField,
	type InlineFormFieldRenderProps,
} from "@/components/common/inline-form-field";
import { useInsMutation } from "@/hooks/convex-react";
import { cn } from "@/lib/utils";
import {
	SubjectAliasSchema,
	SubjectCodeSchema,
	SubjectDescriptionSchema,
	SubjectNameSchema,
} from "../constants";
import { SubjectColorField as SubjectColorPicker } from "../forms/subject-color-field";
import { subjectPath } from "../subject-path";

type SubjectFieldProps = {
	subjectId: Id<"subjects">;
	savedValue: string;
};

function renderTextControl(
	field: InlineFormFieldRenderProps<string>,
	options?: { placeholder?: string; inputClassName?: string },
) {
	return (
		<>
			<InputGroup>
				{field.isSubmitting && (
					<InputGroupAddon align="inline-start">
						<Spinner className="size-4 text-muted-foreground" />
					</InputGroupAddon>
				)}
				<InputGroupInput
					value={field.value}
					onChange={(event) => field.onChange(event.target.value)}
					onBlur={field.onBlur}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							field.onEscape();
						}
					}}
					disabled={field.isSubmitting}
					placeholder={options?.placeholder}
					aria-invalid={field.isInvalid}
					className={options?.inputClassName}
				/>
			</InputGroup>
			{field.isInvalid && <FieldError errors={field.errors} />}
		</>
	);
}

export function SubjectNameField({ subjectId, savedValue }: SubjectFieldProps) {
	const update = useInsMutation(api.subject.mutations.updateName);

	return (
		<InlineFormField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({ name: SubjectNameSchema })}
			onSave={async (name) => {
				await update({ id: subjectId, body: { name } });
			}}
		>
			{(field) =>
				renderTextControl(field, { placeholder: "eg. Applied Science" })
			}
		</InlineFormField>
	);
}

export function SubjectCodeField({ subjectId, savedValue }: SubjectFieldProps) {
	const update = useInsMutation(api.subject.mutations.updateCode);

	return (
		<InlineFormField
			fieldName="code"
			savedValue={savedValue}
			validator={v.object({ code: SubjectCodeSchema })}
			onSave={async (code) => {
				await update({ id: subjectId, body: { code } });
			}}
		>
			{(field) =>
				renderTextControl(field, {
					placeholder: "eg. 15CSE09T",
					inputClassName: "uppercase",
				})
			}
		</InlineFormField>
	);
}

export function SubjectAliasField({
	subjectId,
	savedValue,
}: SubjectFieldProps) {
	const update = useInsMutation(api.subject.mutations.updateAlias);
	const router = useRouter();

	return (
		<InlineFormField
			fieldName="alias"
			savedValue={savedValue}
			validator={v.object({ alias: SubjectAliasSchema })}
			onSave={async (alias) => {
				await update({ id: subjectId, body: { alias } });
				router.replace(subjectPath(alias));
			}}
		>
			{(field) =>
				renderTextControl(field, { placeholder: "eg. applied-science" })
			}
		</InlineFormField>
	);
}

export function SubjectDescriptionField({
	subjectId,
	savedValue,
}: SubjectFieldProps) {
	const update = useInsMutation(api.subject.mutations.updateDescription);

	return (
		<InlineFormField
			fieldName="description"
			savedValue={savedValue}
			className="mt-2 w-full max-w-full text-left"
			validator={v.object({ description: SubjectDescriptionSchema })}
			onSave={async (description) => {
				await update({
					id: subjectId,
					body: { description: description || undefined },
				});
			}}
		>
			{(field) => (
				<>
					<InputGroup className="h-auto min-h-fit">
						<InputGroupTextarea
							value={field.value}
							onChange={(event) => field.onChange(event.target.value)}
							onBlur={field.onBlur}
							onKeyDown={(event) => {
								if (event.key === "Escape") {
									field.onEscape();
									return;
								}
								if (event.key !== "Enter" || event.shiftKey) return;
								event.preventDefault();
								field.submit();
							}}
							disabled={field.isSubmitting}
							placeholder="Brief description of the subject"
							aria-invalid={field.isInvalid}
						/>
						<InputGroupAddon align="block-end">
							{field.isSubmitting ? (
								<Spinner className="size-4 text-muted-foreground" />
							) : (
								<Kbd>Enter ↵</Kbd>
							)}
						</InputGroupAddon>
					</InputGroup>
					{field.isInvalid && <FieldError errors={field.errors} />}
				</>
			)}
		</InlineFormField>
	);
}

export function SubjectColorField({
	subjectId,
	savedValue,
}: SubjectFieldProps) {
	const updateColor = useInsMutation(api.subject.mutations.updateColor);

	return (
		<InlineFormField
			fieldName="color"
			savedValue={savedValue}
			isUnchanged={(next, saved) => next.toLowerCase() === saved.toLowerCase()}
			onSave={async (color) => {
				await updateColor({ id: subjectId, body: { color } });
			}}
		>
			{(field) => (
				<div className={cn("relative space-y-1")}>
					<div className="relative">
						<SubjectColorPicker
							value={field.value}
							onChange={(color) => {
								field.onChange(color);
								field.submit();
							}}
						/>
						{field.isSubmitting && (
							<div className="absolute inset-y-0 -left-6 flex items-center">
								<Spinner className="size-4 text-muted-foreground" />
							</div>
						)}
					</div>
				</div>
			)}
		</InlineFormField>
	);
}
