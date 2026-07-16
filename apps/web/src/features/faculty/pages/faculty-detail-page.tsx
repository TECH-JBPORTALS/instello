"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import { Item, ItemContent, ItemGroup } from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/common/container";
import { PageHeader, PageHeaderStart } from "@/components/common/page-header";
import { useInsQuery } from "@/hooks/convex-react";
import { cn } from "@/lib/utils";
import { DangerZoneSection } from "../components/danger-zone-section";
import { FacultyAvatar } from "../components/faculty-avatar";
import { FacultySettingsSection } from "../components/faculty-settings-section";
import { facultyListPath } from "../faculty-path";
import { getFacultyDisplayName } from "../forms/shared-form";

type FacultyDetailPageProps = {
	listHref?: string;
};

export function FacultyDetailPage({
	listHref = facultyListPath(),
}: FacultyDetailPageProps) {
	const { facultyId } = useParams<{ facultyId: string }>();
	const faculty = useInsQuery(
		api.faculty.queries.getById,
		facultyId ? { id: facultyId as Id<"faculty"> } : "skip",
	);

	if (faculty === undefined) {
		return (
			<Container>
				<FacultyDetailSkeleton />
			</Container>
		);
	}

	const displayName = getFacultyDisplayName(
		faculty.firstName,
		faculty.lastName,
	);

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<Button
						nativeButton={false}
						variant="ghost"
						size="sm"
						className="-ml-2 h-8 rounded-full px-2 text-muted-foreground"
						render={<Link href={listHref} />}
					>
						<IconChevronLeft className="size-4" />
						Faculty
					</Button>
				</PageHeaderStart>
			</PageHeader>

			<div className="mx-auto max-w-3xl space-y-4">
				<div className="space-y-6">
					<div className="flex items-start gap-4">
						<FacultyAvatar
							firstName={faculty.firstName}
							lastName={faculty.lastName}
							image={faculty.image}
							size="xl"
						/>
						<div className="min-w-0 space-y-1.5">
							<div className="flex flex-row flex-wrap items-center gap-1.5">
								<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
									{displayName}
								</h1>
								<Badge
									variant="secondary"
									className={cn(
										"uppercase",
										faculty.status === "active"
											? "bg-success/20 text-success"
											: "bg-warning/20 text-warning",
									)}
								>
									{faculty.status}
								</Badge>
							</div>
							<p className="text-sm text-muted-foreground">{faculty.email}</p>
							<p className="text-sm text-muted-foreground">
								{faculty.designation} · {faculty.staffId}
							</p>
						</div>
					</div>
				</div>

				<FacultySettingsSection
					key={`settings-${faculty._id}-${faculty.updatedAt}`}
					faculty={faculty}
				/>

				<DangerZoneSection
					key={`danger-${faculty.updatedAt}`}
					faculty={faculty}
				/>
			</div>
		</Container>
	);
}

function FacultyDetailSkeleton() {
	return (
		<div className="mx-auto max-w-3xl space-y-10">
			<div className="space-y-6">
				<Skeleton className="h-8 w-28" />
				<div className="flex items-start gap-4">
					<Skeleton className="size-14 rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-56" />
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-5 w-24 rounded-full" />
					</div>
				</div>
			</div>
			<div className="space-y-8">
				{Array.from({ length: 3 }).map((_, sectionIndex) => (
					<div key={sectionIndex} className="space-y-2">
						<Skeleton className="ml-1 h-4 w-16" />
						<ItemGroup className="bg-card">
							{Array.from({ length: 2 }).map((_, index) => (
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
				))}
			</div>
		</div>
	);
}
