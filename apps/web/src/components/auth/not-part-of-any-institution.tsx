"use client";

import { authClient } from "@instello/convex/better-auth/client";
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
	IconBuildingCommunity,
	IconLogout,
	IconMail,
	IconSettings,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { protocol, rootDomain } from "@/lib/utils";

export function NotPartOfAnyInstitution() {
	const { data: session } = authClient.useSession();
	const [isSigningOut, setIsSigningOut] = useState(false);

	async function handleSignOut() {
		setIsSigningOut(true);
		try {
			await authClient.signOut();
			window.location.href = `${protocol}://app.${rootDomain}/sign-in`;
		} catch {
			setIsSigningOut(false);
		}
	}

	return (
		<Card className="sm:min-w-sm w-full max-w-md">
			<CardHeader>
				<div className="mb-1 flex justify-center">
					<div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<IconBuildingCommunity className="size-6" />
					</div>
				</div>
				<CardTitle className="text-center">No institution yet</CardTitle>
				<CardDescription className="text-center">
					Your account is signed in
					{session?.user.email ? (
						<>
							{" "}
							as{" "}
							<span className="font-medium text-foreground">
								{session.user.email}
							</span>
						</>
					) : null}
					, but it isn’t linked to an institution workspace.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
					<p className="leading-relaxed">
						Ask your institution admin to send an invitation to this email. Once
						you accept it, you’ll land in your workspace automatically.
					</p>
				</div>
				<ul className="space-y-2.5 text-sm text-muted-foreground">
					<li className="flex gap-2.5">
						<IconMail className="mt-0.5 size-4 shrink-0 text-foreground/70" />
						<span>Check your inbox for an Instello invitation email.</span>
					</li>
					<li className="flex gap-2.5">
						<IconBuildingCommunity className="mt-0.5 size-4 shrink-0 text-foreground/70" />
						<span>
							If you already accepted an invite, sign out and sign in again with
							the invited email.
						</span>
					</li>
				</ul>
			</CardContent>
			<CardFooter className="flex flex-col gap-2 sm:flex-row">
				<Button
					variant="outline"
					className="w-full sm:flex-1"
					nativeButton={false}
					render={<Link href="/settings" />}
				>
					<IconSettings data-icon="inline-start" />
					Account settings
				</Button>
				<Button
					variant="outline"
					className="w-full sm:flex-1"
					loading={isSigningOut}
					loadingText="Signing out…"
					onClick={() => void handleSignOut()}
				>
					<IconLogout data-icon="inline-start" />
					Sign out
				</Button>
			</CardFooter>
		</Card>
	);
}
