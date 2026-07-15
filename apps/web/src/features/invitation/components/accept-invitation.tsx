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
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconAlertCircle, IconEye, IconEyeClosed } from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form-nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import * as v from "valibot";

const SignUpSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, "Name is required")),
	email: v.pipe(v.string(), v.email("Enter a valid email")),
	password: v.pipe(
		v.string(),
		v.minLength(8, "Password must be at least 8 characters"),
	),
});

const SignInSchema = v.object({
	email: v.pipe(v.string(), v.minLength(2, "Email is required")),
	password: v.pipe(v.string(), v.minLength(2, "Password is required")),
});

type InvitationInfo = {
	email: string;
	organizationName?: string;
};

export function AcceptInvitation({ token }: { token: string | null }) {
	const router = useRouter();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
	const [isLoadingInvitation, setIsLoadingInvitation] = useState(!!token);
	const [invitationError, setInvitationError] = useState<string | null>(null);
	const [acceptError, setAcceptError] = useState<string | null>(null);
	const [isAccepting, setIsAccepting] = useState(false);
	const [hasAccepted, setHasAccepted] = useState(false);
	const [mode, setMode] = useState<"sign-up" | "sign-in">("sign-up");

	const acceptInvitation = useCallback(async () => {
		if (!token || hasAccepted) return;

		setIsAccepting(true);
		setAcceptError(null);
		try {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId: token,
			});

			if (error) {
				setAcceptError(error.message ?? "Failed to accept invitation");
				return;
			}

			setHasAccepted(true);
			router.replace("/");
			router.refresh();
		} catch {
			setAcceptError("Failed to accept invitation");
		} finally {
			setIsAccepting(false);
		}
	}, [token, hasAccepted, router]);

	useEffect(() => {
		if (!token) {
			setIsLoadingInvitation(false);
			setInvitationError("Missing invitation token.");
			return;
		}

		let cancelled = false;

		async function loadInvitation() {
			setIsLoadingInvitation(true);
			const invitationId = token;
			if (!invitationId) return;

			const { data, error } = await authClient.organization.getInvitation({
				query: { id: invitationId },
			});

			if (cancelled) return;

			if (error || !data) {
				setInvitationError(
					error?.message ?? "Invitation not found or expired.",
				);
				setIsLoadingInvitation(false);
				return;
			}

			setInvitation({
				email: data.email,
				organizationName:
					"organizationName" in data &&
					typeof data.organizationName === "string"
						? data.organizationName
						: undefined,
			});
			setIsLoadingInvitation(false);
		}

		void loadInvitation();
		return () => {
			cancelled = true;
		};
	}, [token]);

	useEffect(() => {
		if (
			session &&
			token &&
			!isSessionPending &&
			!isLoadingInvitation &&
			!hasAccepted &&
			!isAccepting
		) {
			void acceptInvitation();
		}
	}, [
		session,
		token,
		isSessionPending,
		isLoadingInvitation,
		hasAccepted,
		isAccepting,
		acceptInvitation,
	]);

	if (!token) {
		return (
			<Card className="sm:min-w-sm min-w-full max-w-min">
				<CardHeader>
					<CardTitle>Invalid invitation</CardTitle>
					<CardDescription>
						This invitation link is missing a token. Ask your institution admin
						to resend the invite.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (isSessionPending || isLoadingInvitation || (session && isAccepting)) {
		return (
			<Card className="sm:min-w-sm min-w-full max-w-min">
				<CardHeader>
					<CardTitle>Accepting invitation</CardTitle>
					<CardDescription>Please wait…</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-4 w-48" />
					<Skeleton className="h-9 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (session) {
		return (
			<Card className="sm:min-w-sm min-w-full max-w-min">
				<CardHeader>
					<CardTitle>Accept invitation</CardTitle>
					<CardDescription>
						{invitation?.organizationName
							? `Join ${invitation.organizationName}`
							: "Join your institution"}
					</CardDescription>
				</CardHeader>
				{acceptError && (
					<CardContent>
						<Alert variant="destructive">
							<IconAlertCircle />
							<AlertTitle>Could not accept</AlertTitle>
							<AlertDescription>{acceptError}</AlertDescription>
						</Alert>
					</CardContent>
				)}
				<CardFooter>
					<Button
						className="w-full"
						disabled={isAccepting}
						onClick={() => void acceptInvitation()}
					>
						{isAccepting ? "Accepting…" : "Accept invitation"}
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="sm:min-w-sm min-w-full max-w-min">
			<CardHeader>
				<CardTitle>
					{mode === "sign-up" ? "Create your account" : "Sign in to continue"}
				</CardTitle>
				<CardDescription>
					{invitationError
						? invitationError
						: invitation?.organizationName
							? `Accept your invitation to join ${invitation.organizationName}`
							: "Accept your institution invitation"}
				</CardDescription>
			</CardHeader>
			{mode === "sign-up" ? (
				<InvitationSignUpForm
					key={`sign-up-${invitation?.email ?? "unknown"}`}
					defaultEmail={invitation?.email ?? ""}
					onSuccess={() => void acceptInvitation()}
					onSwitchToSignIn={() => setMode("sign-in")}
				/>
			) : (
				<InvitationSignInForm
					key={`sign-in-${invitation?.email ?? "unknown"}`}
					defaultEmail={invitation?.email ?? ""}
					onSuccess={() => void acceptInvitation()}
					onSwitchToSignUp={() => setMode("sign-up")}
				/>
			)}
		</Card>
	);
}

function InvitationSignUpForm({
	defaultEmail,
	onSuccess,
	onSwitchToSignIn,
}: {
	defaultEmail: string;
	onSuccess: () => void;
	onSwitchToSignIn: () => void;
}) {
	const [showPassword, setShowPassword] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			name: "",
			email: defaultEmail,
			password: "",
		},
		validators: { onChange: SignUpSchema },
		onSubmit: async ({ value }) => {
			try {
				setGlobalError(null);
				const { error } = await authClient.signUp.email({
					name: value.name,
					email: value.email,
					password: value.password,
				});

				if (error?.message) {
					setGlobalError(error.message);
					return;
				}

				onSuccess();
			} catch {
				setGlobalError("Something went wrong");
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
		>
			<CardContent>
				{globalError && (
					<Alert variant="destructive" className="mb-4">
						<IconAlertCircle />
						<AlertTitle>Sign up failed</AlertTitle>
						<AlertDescription>{globalError}</AlertDescription>
					</Alert>
				)}
				<FieldGroup>
					<form.Field name="name">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Full name</FieldLabel>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={isInvalid}
										placeholder="Jane Doe"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
					<form.Field name="email">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Email</FieldLabel>
									<Input
										id={field.name}
										type="email"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={isInvalid}
										readOnly={!!defaultEmail}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
					<form.Field name="password">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Password</FieldLabel>
									<InputGroup>
										<InputGroupInput
											id={field.name}
											type={showPassword ? "text" : "password"}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											aria-invalid={isInvalid}
										/>
										<InputGroupButton
											type="button"
											onClick={() => setShowPassword((v) => !v)}
										>
											{showPassword ? <IconEyeClosed /> : <IconEye />}
										</InputGroupButton>
									</InputGroup>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>
			</CardContent>
			<CardFooter className="flex flex-col gap-3">
				<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Creating account…" : "Create account & join"}
						</Button>
					)}
				</form.Subscribe>
				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<button
						type="button"
						className="text-foreground underline-offset-4 hover:underline"
						onClick={onSwitchToSignIn}
					>
						Sign in
					</button>
				</p>
			</CardFooter>
		</form>
	);
}

function InvitationSignInForm({
	defaultEmail,
	onSuccess,
	onSwitchToSignUp,
}: {
	defaultEmail: string;
	onSuccess: () => void;
	onSwitchToSignUp: () => void;
}) {
	const [showPassword, setShowPassword] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			email: defaultEmail,
			password: "",
		},
		validators: { onChange: SignInSchema },
		onSubmit: async ({ value }) => {
			try {
				setGlobalError(null);
				const { error } = await authClient.signIn.email({
					email: value.email,
					password: value.password,
				});

				if (error?.message) {
					setGlobalError(error.message);
					return;
				}

				onSuccess();
			} catch {
				setGlobalError("Something went wrong");
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
		>
			<CardContent>
				{globalError && (
					<Alert variant="destructive" className="mb-4">
						<IconAlertCircle />
						<AlertTitle>Sign in failed</AlertTitle>
						<AlertDescription>{globalError}</AlertDescription>
					</Alert>
				)}
				<FieldGroup>
					<form.Field name="email">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Email</FieldLabel>
									<Input
										id={field.name}
										type="email"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
					<form.Field name="password">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Password</FieldLabel>
									<InputGroup>
										<InputGroupInput
											id={field.name}
											type={showPassword ? "text" : "password"}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											aria-invalid={isInvalid}
										/>
										<InputGroupButton
											type="button"
											onClick={() => setShowPassword((v) => !v)}
										>
											{showPassword ? <IconEyeClosed /> : <IconEye />}
										</InputGroupButton>
									</InputGroup>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>
			</CardContent>
			<CardFooter className="flex flex-col gap-3">
				<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Signing in…" : "Sign in & join"}
						</Button>
					)}
				</form.Subscribe>
				<p className="text-center text-sm text-muted-foreground">
					New here?{" "}
					<button
						type="button"
						className="text-foreground underline-offset-4 hover:underline"
						onClick={onSwitchToSignUp}
					>
						Create an account
					</button>
				</p>
			</CardFooter>
		</form>
	);
}
