"use client";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import {
	InputGroup,
	InputGroupButton,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { useForm } from "@tanstack/react-form-nextjs";
import * as v from "valibot";

const SignInSchema = v.object({
	email: v.pipe(v.string(), v.minLength(2, "Email is required")),
	password: v.pipe(v.string(), v.minLength(2, "Password is required")),
});

export function SignIn() {
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: SignInSchema,
		},
		onSubmit: async ({ value }) => {
			alert("submitted!");
		},
	});

	return (
		<Card className="sm:min-w-xs min-w-full max-w-min">
			<CardHeader>
				<CardTitle className="text-center">Sign in to your account</CardTitle>
				<CardDescription className="text-center">
					Welcome back! Please enter details to continue
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					id="sign-in-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						{/** Email address */}
						<form.Field
							name="email"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Email address</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											autoComplete="off"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						{/** Password */}
						<form.Field
							name="password"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Password</FieldLabel>
										<InputGroup>
											<InputGroupInput
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												autoComplete="off"
											/>
											<InputGroupButton>D</InputGroupButton>
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
				<Field>
					<Button className={"w-full"} type="submit" form="sign-in-form">
						Sign in
					</Button>
				</Field>
			</CardFooter>
		</Card>
	);
}
