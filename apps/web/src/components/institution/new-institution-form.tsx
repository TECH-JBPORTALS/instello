"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import {
	Card,
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
import { IconBuilding } from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form-nextjs";
import { useRouter } from "next/navigation";
import * as v from "valibot";

const NewInstitutionSchema = v.object({
	logo: v.pipe(v.string()),
	name: v.pipe(v.string(), v.nonEmpty("Name is required")),
	slug: v.pipe(
		v.string(),
		v.slug(
			"Invalid slug. Example slugs 'acme' or 'acme-in' or 'acme_in' or '10acme-in' ",
		),
		v.nonEmpty("Slug is required"),
	),
});

export function NewInstitutionForm() {
	const router = useRouter();
	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
			logo: "",
		},
		validators: {
			onChange: NewInstitutionSchema,
		},
		asyncDebounceMs: 2000,
		onSubmit(props) {
			console.log(props);
		},
	});

	return (
		<Card className="min-w-lg">
			<CardHeader>
				<CardTitle>Create new institution</CardTitle>
				<CardDescription>
					Add your institution's name and create unique domain for your
					institution
				</CardDescription>
			</CardHeader>
			<CardContent className="pb-12">
				<form
					id="new-ins-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="logo"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Institution logo
										</FieldLabel>
										<div className="flex gap-3.5 items-center">
											<Avatar size="xl">
												<AvatarImage src={field.state.value} />
												<AvatarFallback>
													<IconBuilding />
												</AvatarFallback>
											</Avatar>
											<Button size={"sm"} variant={"outline"}>
												Upload
											</Button>
										</div>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
										<FieldDescription>
											Recommended size 64x64px (max 5mb)
										</FieldDescription>
									</Field>
								);
							}}
						/>

						<form.Field
							name="name"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
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

						<form.Field
							name="slug"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
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
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="aec"
												autoComplete="off"
											/>
											<InputGroupAddon align={"inline-end"}>
												.instello.in
											</InputGroupAddon>
										</InputGroup>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Field orientation={"horizontal"} className="justify-end">
					<Button
						type="button"
						onClick={() => router.push("/")}
						variant={"outline"}
					>
						Cancel
					</Button>
					<Button form="new-ins-form" type="submit">
						Continue
					</Button>
				</Field>
			</CardFooter>
		</Card>
	);
}
