"use client";
import { authClient } from "@instello/convex/better-auth/client";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
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
import { IconAlertCircle, IconEye, IconEyeClosed } from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form-nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as v from "valibot";

const SignInSchema = v.object({
	email: v.pipe(v.string(), v.minLength(2, "Email is required")),
	password: v.pipe(v.string(), v.minLength(2, "Password is required")),
});

export function SignIn() {
	const [showPassword, setShowPassword] = useState(false);
	const [globalError, setGlobalError] = useState<null | string>(null);
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: SignInSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				setGlobalError(null);
				await authClient.signIn.email({
					email: value.email,
					password: value.password,
					fetchOptions: {
						onSuccess() {
							router.refresh();
						},
						onError(context) {
							setGlobalError(context.error.message);
						},
					},
				});
			} catch (_e) {
				setGlobalError("something went wrong");
			}
		},
	});

	return (
		<Card className="sm:min-w-sm min-w-full max-w-min">
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
					<FieldGroup className="mb-3">
						{globalError && (
							<Alert variant={"destructive"}>
								<IconAlertCircle />
								<AlertTitle>{globalError}</AlertTitle>
								<AlertDescription>
									Check invalid details displayed in the message.
								</AlertDescription>
							</Alert>
						)}
					</FieldGroup>
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
												type={showPassword ? "text" : "password"}
											/>
											<InputGroupButton
												onClick={() => setShowPassword((show) => !show)}
											>
												{showPassword ? <IconEye /> : <IconEyeClosed />}
											</InputGroupButton>
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
					<Button
						className={"w-full"}
						loading={form.state.isSubmitting}
						loadingText="Signing in..."
						disabled={!form.state.canSubmit}
						type="submit"
						form="sign-in-form"
					>
						Sign in
					</Button>
					<p className="text-center">
						Did you forgot your password?{" "}
						<Link
							className="text-primary/90 hover:text-primary"
							href={"/reset-password"}
						>
							Reset
						</Link>
					</p>
				</Field>
			</CardFooter>
		</Card>
	);
}
