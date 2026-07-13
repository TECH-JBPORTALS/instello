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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Spinner } from "@instello/ui/components/spinner";
import { useMutation } from "convex/react";
import * as v from "valibot";
import {
	InlineFormField,
	type InlineFormFieldRenderProps,
} from "@/components/common/inline-form-field";
import {
	PatternDescriptionSchema,
	PatternNameSchema,
	SYSTEM_TYPE_LABELS,
	SYSTEM_YEARS_LABELS,
	type SystemType,
} from "../constants";

function usePatchMetadata() {
	return useMutation(api.academicPattern.mutations.patchMetadata);
}

function usePatchCore() {
	return useMutation(api.academicPattern.mutations.patchCore);
}

function renderTextControl(field: InlineFormFieldRenderProps<string>) {
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
					aria-invalid={field.isInvalid}
				/>
			</InputGroup>
			{field.isInvalid && <FieldError errors={field.errors} />}
		</>
	);
}

type PatternFieldProps = {
	patternId: Id<"academicPatterns">;
};

export function PatternNameField({
	patternId,
	savedValue,
}: PatternFieldProps & { savedValue: string }) {
	const patchMetadata = usePatchMetadata();

	return (
		<InlineFormField
			fieldName="name"
			savedValue={savedValue}
			validator={v.object({ name: PatternNameSchema })}
			onSave={async (name) => {
				await patchMetadata({ id: patternId, body: { name } });
			}}
		>
			{(field) => renderTextControl(field)}
		</InlineFormField>
	);
}

export function PatternDescriptionField({
	patternId,
	savedValue,
}: PatternFieldProps & { savedValue: string }) {
	const patchMetadata = usePatchMetadata();

	return (
		<InlineFormField
			fieldName="description"
			savedValue={savedValue}
			className="mt-2 w-full max-w-full text-left"
			validator={v.object({ description: PatternDescriptionSchema })}
			onSave={async (description) => {
				await patchMetadata({
					id: patternId,
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
							placeholder="Add a description…"
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

export function PatternSystemTypeField({
	patternId,
	savedValue,
	readOnly = false,
}: PatternFieldProps & { savedValue: SystemType; readOnly?: boolean }) {
	const patchCore = usePatchCore();

	return (
		<InlineFormField
			fieldName="systemType"
			savedValue={savedValue}
			onSave={async (systemType) => {
				await patchCore({ id: patternId, body: { systemType } });
			}}
		>
			{(field) => (
				<div className="flex items-center gap-2">
					{field.isSubmitting && (
						<Spinner className="size-4 shrink-0 text-muted-foreground" />
					)}
					<Select
						value={field.value}
						onValueChange={(next) => {
							if (!next || readOnly) return;
							field.onChange(next as SystemType);
							field.submit();
						}}
						disabled={field.isSubmitting || readOnly}
					>
						<SelectTrigger className="h-8 w-auto min-w-28 bg-transparent shadow-none hover:bg-accent/50">
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="center">
							{Object.entries(SYSTEM_TYPE_LABELS).map(
								([optionValue, label]) => (
									<SelectItem key={optionValue} value={optionValue}>
										{label}
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				</div>
			)}
		</InlineFormField>
	);
}

export function PatternDurationField({
	patternId,
	savedValue,
	readOnly = false,
}: PatternFieldProps & { savedValue: number; readOnly?: boolean }) {
	const patchCore = usePatchCore();
	const savedValueString = String(savedValue);

	return (
		<InlineFormField
			fieldName="durationInYears"
			savedValue={savedValueString}
			normalize={(value) => String(Number(value))}
			isUnchanged={(next, saved) => Number(next) === Number(saved)}
			onSave={async (value) => {
				await patchCore({
					id: patternId,
					body: { durationInYears: Number(value) },
				});
			}}
		>
			{(field) => (
				<div className="flex items-center gap-2">
					{field.isSubmitting && (
						<Spinner className="size-4 shrink-0 text-muted-foreground" />
					)}
					<Select
						value={field.value}
						onValueChange={(next) => {
							if (!next || readOnly) return;
							field.onChange(next);
							field.submit();
						}}
						disabled={field.isSubmitting || readOnly}
					>
						<SelectTrigger className="h-8 w-auto min-w-28 bg-transparent shadow-none hover:bg-accent/50">
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="center">
							{Object.entries(SYSTEM_YEARS_LABELS).map(
								([optionValue, label]) => (
									<SelectItem key={optionValue} value={optionValue}>
										{label}
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				</div>
			)}
		</InlineFormField>
	);
}
