"use client";

import { api } from "@instello/convex/api";
import { authClient } from "@instello/convex/better-auth/client";
import { ERROR_CODES, RESERVED_SUBDOMAINS } from "@instello/convex/errors";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import {
	IconBuilding,
	IconCircleCheckFilled,
	IconTrash,
	IconUpload,
} from "@tabler/icons-react";
import { useConvex } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import * as v from "valibot";
import { withForm } from "@/hooks/form";
import {
	BasicInfoSchema,
	CodeSchema,
	newInstitutionFormOpt,
	SlugSchema,
} from "./shared-form";

const LOGO_MAX_BYTES = 5 * 1024 * 1024;

function LogoUploadField({
	id,
	name,
	value,
	isInvalid,
	errors,
	onChange,
	onBlur,
}: {
	id: string;
	name: string;
	value: string;
	isInvalid: boolean;
	errors: Parameters<typeof FieldError>[0]["errors"];
	onChange: (value: string) => void;
	onBlur: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileError, setFileError] = useState<string | null>(null);

	const handleFileSelect = (file: File | undefined) => {
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setFileError("Please select an image file");
			return;
		}

		if (file.size > LOGO_MAX_BYTES) {
			setFileError("Image must be 5MB or smaller");
			return;
		}

		setFileError(null);
		const reader = new FileReader();
		reader.onload = () => {
			onChange(reader.result as string);
			onBlur();
		};
		reader.readAsDataURL(file);
	};

	return (
		<Field data-invalid={isInvalid || !!fileError}>
			<FieldLabel htmlFor={id}>Institution logo</FieldLabel>
			<div className="flex items-center gap-3.5">
				<Avatar size="xl" className="rounded-lg after:rounded-lg">
					<AvatarImage
						src={value === "" ? undefined : value}
						alt="Institution logo"
						className="rounded-lg"
					/>
					<AvatarFallback className="rounded-lg">
						<IconBuilding />
					</AvatarFallback>
				</Avatar>
				<div className="flex flex-wrap gap-2">
					<input
						ref={inputRef}
						id={id}
						name={name}
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={(e) => {
							handleFileSelect(e.target.files?.[0]);
							e.target.value = "";
						}}
					/>
					{value ? (
						<>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => inputRef.current?.click()}
							>
								<IconUpload />
								Re-upload
							</Button>
							<Button
								type="button"
								size="sm"
								variant="destructive"
								onClick={() => {
									onChange("");
									onBlur();
									setFileError(null);
								}}
							>
								<IconTrash />
								Remove
							</Button>
						</>
					) : (
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => inputRef.current?.click()}
						>
							<IconUpload />
							Upload
						</Button>
					)}
				</div>
			</div>
			{fileError && <FieldError errors={[{ message: fileError }]} />}
			{isInvalid && !fileError && <FieldError errors={errors} />}
			<FieldDescription>Recommended size 64x64px (max 5mb)</FieldDescription>
		</Field>
	);
}

export const BasicInfoForm = withForm({
	...newInstitutionFormOpt,
	props: {
		step: 0,
		setStep: (_step: number) => {},
	},
	render: function Render({ form, step, setStep }) {
		const convex = useConvex();
		const router = useRouter();

		return (
			<form.FormGroup
				name="basicInfo"
				validators={{
					onDynamic: BasicInfoSchema,
				}}
				onGroupSubmit={({ value: _value }) => {
					setStep(step + 1);
				}}
				children={(formGroup) => {
					return (
						<form
							className="flex min-h-[520px] min-w-sm flex-col"
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								formGroup.handleSubmit();
							}}
						>
							<CardHeader className="shrink-0 p-0">
								<CardTitle className="text-lg">
									Create new institution
								</CardTitle>
								<CardDescription>
									Add your institution's name and create unique domain for your
									institution
								</CardDescription>
							</CardHeader>
							<CardContent className="flex-1 px-0 py-4">
								<FieldGroup>
									<form.AppField
										name="basicInfo.logo"
										children={(field) => {
											const showErrors =
												field.state.meta.isTouched ||
												formGroup.state.meta.submissionAttempts > 0;
											const isInvalid = showErrors && !field.state.meta.isValid;
											return (
												<LogoUploadField
													id={field.name}
													name={field.name}
													value={field.state.value}
													isInvalid={isInvalid}
													errors={field.state.meta.errors}
													onChange={field.handleChange}
													onBlur={field.handleBlur}
												/>
											);
										}}
									/>

									<form.AppField
										name="basicInfo.name"
										children={(field) => {
											const showErrors =
												field.state.meta.isTouched ||
												formGroup.state.meta.submissionAttempts > 0;
											const isInvalid = showErrors && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>
														Institution name
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="Acme Engineering College"
														autoComplete="off"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									/>

									<form.AppField
										name="basicInfo.code"
										validators={{
											onChange: CodeSchema,
											onChangeAsync: async ({ value }) => {
												const code = value.trim();
												if (!code) return undefined;

												const parsed = v.safeParse(CodeSchema, code);
												if (!parsed.success) return undefined;

												const { available } = await convex.query(
													api.institution.queries.checkCode,
													{ code },
												);

												if (!available) {
													return "This code is already taken";
												}

												return undefined;
											},
											onChangeAsyncDebounceMs: 500,
										}}
										children={(field) => {
											const showErrors =
												field.state.meta.isTouched ||
												formGroup.state.meta.submissionAttempts > 0;
											const isInvalid = showErrors && !field.state.meta.isValid;
											const code = field.state.value.trim();
											const isChecking = field.state.meta.isValidating;
											const showAvailable =
												code.length > 0 &&
												field.state.meta.isDirty &&
												!isChecking &&
												field.state.meta.isValid;

											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>
														Institution unique code
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="eg. 364"
														autoComplete="off"
													/>
													{isInvalid && (
														<FieldError
															errors={field.state.meta.errors.map((error) =>
																typeof error === "string"
																	? { message: error }
																	: error,
															)}
														/>
													)}
													{isChecking && code.length > 0 && (
														<FieldDescription>
															Checking availability…
														</FieldDescription>
													)}
													{showAvailable && !isInvalid && (
														<FieldDescription className="flex items-center-safe gap-0.5 text-success">
															<IconCircleCheckFilled className="size-4" />
															<span>This code is available</span>
														</FieldDescription>
													)}
												</Field>
											);
										}}
									/>

									<form.AppField
										name="basicInfo.slug"
										validators={{
											onChange: SlugSchema,
											onChangeAsync: async ({ value }) => {
												const slug = value.trim();
												if (!slug) return undefined;

												const parsed = v.safeParse(SlugSchema, slug);
												if (!parsed.success) return undefined;

												if (RESERVED_SUBDOMAINS.has(slug))
													return ERROR_CODES.BASE.INSITUTION_SLUG_RESERVED
														.message;

												const { error } =
													await authClient.organization.checkSlug({ slug });

												if (error) {
													return ERROR_CODES.ORGANIZATION
														.ORGANIZATION_SLUG_ALREADY_TAKEN.message;
												}

												return undefined;
											},
											onChangeAsyncDebounceMs: 500,
										}}
										children={(field) => {
											const showErrors =
												field.state.meta.isTouched ||
												formGroup.state.meta.submissionAttempts > 0;
											const isInvalid = showErrors && !field.state.meta.isValid;
											const slug = field.state.value.trim();
											const isChecking = field.state.meta.isValidating;
											const showAvailable =
												slug.length > 0 &&
												field.state.meta.isDirty &&
												!isChecking &&
												field.state.meta.isValid;

											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>
														Institution domain
													</FieldLabel>
													<InputGroup>
														<InputGroupAddon>https://</InputGroupAddon>
														<InputGroupInput
															id={field.name}
															name={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															aria-invalid={isInvalid}
															placeholder="aec"
															autoComplete="off"
														/>
														<InputGroupAddon align={"inline-end"}>
															.instello.in
														</InputGroupAddon>
													</InputGroup>
													{isInvalid && (
														<FieldError
															errors={field.state.meta.errors.map((error) =>
																typeof error === "string"
																	? { message: error }
																	: error,
															)}
														/>
													)}
													{isChecking && slug.length > 0 && (
														<FieldDescription>
															Checking availability…
														</FieldDescription>
													)}
													{showAvailable && !isInvalid && (
														<FieldDescription className="text-success flex gap-0.5 items-center-safe">
															<IconCircleCheckFilled className="size-4" />{" "}
															<span>This domain is available</span>
														</FieldDescription>
													)}
												</Field>
											);
										}}
									/>
								</FieldGroup>
							</CardContent>
							<CardFooter className="mt-auto shrink-0 border-t-0 bg-transparent">
								<form.AppForm>
									<Field orientation={"horizontal"} className="justify-end">
										<Button
											type="button"
											variant={"outline"}
											onClick={() => router.back()}
										>
											Cancel
										</Button>
										<form.SubscribeButton label="Continue" />
									</Field>
								</form.AppForm>
							</CardFooter>
						</form>
					);
				}}
			/>
		);
	},
});
