"use client";

import { api } from "@instello/convex/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import { ButtonGroup } from "@instello/ui/components/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@instello/ui/components/dropdown-menu";
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
import {
	IconBuildings,
	IconCheck,
	IconCopy,
	IconDots,
	IconExternalLink,
} from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { isEmpty, isUndefined } from "lodash";
import Link from "next/link";
import { useState } from "react";
import { mainNavSections } from "@/components/sidebars/institution-sidebar/nav-items";
import { institutionUrl, protocol, rootDomain } from "@/lib/utils";

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
		<ItemGroup className="bg-card">
			{institutions.map((ins) => (
				<Item
					key={ins._id}
					className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
				>
					<Link
						className="absolute inset-0"
						href={`${protocol}://${ins.slug}.${rootDomain}`}
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
						<InstitutionListActions slug={ins.slug} />
					</ItemActions>
				</Item>
			))}
		</ItemGroup>
	);
}

const QUICK_LINK_IDS = new Set([
	"students",
	"faculty",
	"attendance",
	"timetables",
]);
const quickLinks = mainNavSections
	.flatMap((section) => section.items)
	.filter((item) => QUICK_LINK_IDS.has(item.id));

function InstitutionListActions({ slug }: { slug: string }) {
	const [copied, setCopied] = useState(false);
	const baseUrl = institutionUrl(slug);
	async function handleCopy() {
		await navigator.clipboard.writeText(baseUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<ButtonGroup>
			<Button
				variant="outline"
				size="icon-sm"
				onClick={handleCopy}
				aria-label={copied ? "Copied" : "Copy institution link"}
			>
				{copied ? <IconCheck /> : <IconCopy />}
			</Button>
			<Button
				variant="outline"
				size="icon-sm"
				onClick={() => window.open(baseUrl, "_blank")}
				aria-label="Open institution link in new tab"
			>
				<IconExternalLink />
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<Button variant="outline" size="icon-sm" />}
				>
					<IconDots />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="bottom">
					{quickLinks.map((item) => (
						<DropdownMenuItem
							key={item.id}
							render={
								<Link href={institutionUrl(slug, item.href)} target="_blank" />
							}
						>
							<item.icon className="size-4" />
							{item.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
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
