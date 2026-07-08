"use client";

import { authClient } from "@instello/convex/better-auth/client";
import { Button } from "@instello/ui/components/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@instello/ui/components/item";
import { IconLogout } from "@tabler/icons-react";
import * as v from "valibot";
import { InlineTextField } from "@/features/students/sections/fields/inline-text-field";
import { protocol, rootDomain } from "@/lib/utils";
import { ProfileImageField } from "./profile-image-field";

type GeneralSettingsSectionProps = {
	name: string;
	email: string;
	image?: string | null;
};

export function GeneralSettingsSection({
	name,
	email,
	image,
}: GeneralSettingsSectionProps) {
	async function handleLogout() {
		await authClient.signOut();
		window.location.href = `${protocol}://app.${rootDomain}/sign-in`;
	}

	return (
		<Card className="bg-transparent! shadow-none! ring-0!">
			<CardHeader className="px-0">
				<CardTitle>General</CardTitle>
				<CardDescription>Manage your personal account settings</CardDescription>
			</CardHeader>
			<ItemGroup variant="stack">
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Profile image</ItemTitle>
						<ItemDescription>Optional profile photo</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ProfileImageField name={name} imageUrl={image} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Name</ItemTitle>
						<ItemDescription>Your display name across Instello</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InlineTextField
							fieldName="name"
							savedValue={name}
							validator={v.object({
								name: v.pipe(v.string(), v.nonEmpty("Name is required")),
							})}
							onSave={async (value) => {
								const { error } = await authClient.updateUser({ name: value });
								if (error) {
									throw new Error(error.message ?? "Failed to update name");
								}
							}}
						/>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Email</ItemTitle>
						<ItemDescription>
							Your sign-in email (cannot be changed)
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<p className="text-sm text-muted-foreground">{email}</p>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Log out</ItemTitle>
						<ItemDescription>Sign out of your Instello account</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => void handleLogout()}
						>
							<IconLogout className="size-4" />
							Log out
						</Button>
					</ItemActions>
				</Item>
			</ItemGroup>
		</Card>
	);
}
