"use client";

import { api } from "@instello/convex/api";
import { authClient } from "@instello/convex/better-auth/client";
import { Button } from "@instello/ui/components/button";
import { Item, ItemContent, ItemGroup } from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconChevronLeft } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/common/container";
import { PageHeader, PageHeaderStart } from "@/components/common/page-header";
import { AppearanceSection } from "./appearance-section";
import { GeneralSettingsSection } from "./general-settings-section";
import { OwnerOrganizationSection } from "./owner-organization-section";

export function SettingsView() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const from = searchParams.get("from");
	const { data: session, isPending } = authClient.useSession();
	const ownerOrganization = useQuery(api.ownerOrganizations.getByUser);

	if (isPending || session === undefined) {
		return (
			<Container>
				<SettingsSkeleton />
			</Container>
		);
	}

	const user = session?.user;

	if (!user) {
		return null;
	}

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					{from ? (
						<Button
							nativeButton={false}
							variant="ghost"
							size="sm"
							className="-ml-2 h-8 rounded-full px-2 text-muted-foreground"
							render={
								<a href={from} aria-label="Back">
									Back
								</a>
							}
						/>
					) : (
						<Button
							variant="ghost"
							size="sm"
							className="-ml-2 h-8 rounded-full px-2 text-muted-foreground"
							onClick={() => router.back()}
						>
							<IconChevronLeft className="size-4" />
							Back
						</Button>
					)}
				</PageHeaderStart>
			</PageHeader>

			<div className="mx-auto max-w-3xl space-y-4">
				<div className="space-y-6">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
							Settings
						</h1>
						<p className="text-sm text-muted-foreground">
							Manage your account and organization preferences
						</p>
					</div>
				</div>

				<div className="space-y-8">
					<GeneralSettingsSection
						name={user.name}
						email={user.email}
						image={user.image}
					/>

					<AppearanceSection />

					{ownerOrganization === undefined ? (
						<SectionSkeleton />
					) : ownerOrganization ? (
						<OwnerOrganizationSection organization={ownerOrganization} />
					) : null}
				</div>
			</div>
		</Container>
	);
}

function SettingsSkeleton() {
	return (
		<div className="mx-auto max-w-3xl space-y-10">
			<div className="space-y-6">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>
			<SectionSkeleton />
			<SectionSkeleton />
		</div>
	);
}

function SectionSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="ml-1 h-4 w-16" />
			<ItemGroup className="bg-card">
				{Array.from({ length: 3 }).map((_, index) => (
					<Item
						key={index}
						className="rounded-none border-x-0 border-t-0 border-border! last:border-b-0"
					>
						<ItemContent className="flex-row items-center justify-between gap-4 py-1">
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-48" />
							</div>
							<Skeleton className="h-8 w-36" />
						</ItemContent>
					</Item>
				))}
			</ItemGroup>
		</div>
	);
}
