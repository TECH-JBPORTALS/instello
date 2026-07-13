"use client";

import { api } from "@instello/convex/api";
import { Item, ItemGroup } from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery } from "@/hooks/convex-react";
import { InstitutionGeneralSection } from "../sections/institution-general-section";

export function InstitutionSettingsPage() {
	const institution = useInsQuery(api.institution.queries.getCurrent, {});

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Institution settings</PageHeaderTitle>
					<PageHeaderDescription>
						Manage institution details and programs
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<div className="mx-auto max-w-3xl space-y-8">
				{institution ? (
					<InstitutionGeneralSection
						key={`general-${institution._id}-${institution.name}-${institution.addressLine}`}
						institution={institution}
					/>
				) : (
					<SettingsSkeleton />
				)}
			</div>
		</Container>
	);
}

function SettingsSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="ml-1 h-4 w-16" />
			<ItemGroup className="bg-card">
				{Array.from({ length: 4 }).map((_, index) => (
					<Item
						key={index}
						className="rounded-none border-x-0 border-t-0 border-border! last:border-b-0"
					>
						<div className="flex w-full items-center justify-between gap-4 py-1">
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-48" />
							</div>
							<Skeleton className="h-8 w-36" />
						</div>
					</Item>
				))}
			</ItemGroup>
		</div>
	);
}
