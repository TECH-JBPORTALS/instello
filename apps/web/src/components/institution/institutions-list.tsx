"use client";

import { api } from "@instello/convex/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconBuildings, IconDots } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { isEmpty, isUndefined } from "lodash";
import Link from "next/link";
import { protocol, rootDomain } from "@/lib/utils";

export function InstitutionsList() {
	const institutions = useQuery(api.institutions.listMyOwned);

	if (isUndefined(institutions)) return <InstitutionListSkeleton count={10} />;

	if (isEmpty(institutions))
		return (
			<Empty className="border border-border min-h-72 border-dashed">
				<EmptyMedia variant={"icon"}>
					<IconBuildings />
				</EmptyMedia>
				<EmptyHeader>
					<EmptyTitle>No institutions</EmptyTitle>
					<EmptyDescription>
						Let's have a cup of coffee and take you through smooth onboarding of
						your first institution.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);

	return (
		<ItemGroup>
			{institutions.map((ins) => (
				<Item
					key={ins._id}
					className="border-x-0 border-t-0 hover:bg-accent/30 relative last:border-b-0 rounded-none border-border!"
				>
					<Link
						href={`${protocol}://${ins.slug}.${rootDomain}`}
						className="absolute inset-0"
					/>
					<ItemMedia variant={"image"}>
						<Avatar size="lg" className={"after:rounded-lg"}>
							{ins.logo && (
								<AvatarImage src={ins.logo} alt={`${ins.name}'s logo`} />
							)}
							<AvatarFallback className={"rounded-lg"}>
								{ins.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{ins.name}</ItemTitle>
						<ItemDescription>
							{ins.addressLine}, {ins.district}, {ins.state} - {ins.zipCode}
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button variant={"outline"} size={"icon-sm"}>
							<IconDots />
						</Button>
					</ItemActions>
				</Item>
			))}
		</ItemGroup>
	);
}

function InstitutionListSkeleton({ count }: { count: number }) {
	return (
		<div className="rounded-lg border shadow-xs">
			{Array.from({ length: count }).map((_, i) => (
				<Item
					key={i}
					className="border-x-0 border-t-0 hover:bg-accent/50 last:border-b-0 rounded-none border-border!"
				>
					<ItemMedia variant={"image"}>
						<Skeleton className={"size-10 rounded-lg"} />
					</ItemMedia>
					<ItemContent className="space-y-2.5">
						<Skeleton className="h-3 w-22" />
						<Skeleton className="h-2 w-64" />
					</ItemContent>
					<ItemActions>
						<Skeleton className="size-6" />
					</ItemActions>
				</Item>
			))}
		</div>
	);
}
