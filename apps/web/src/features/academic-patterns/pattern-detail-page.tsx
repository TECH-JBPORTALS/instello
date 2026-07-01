"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@instello/ui/components/alert";
import { Button } from "@instello/ui/components/button";
import { Item, ItemContent, ItemGroup } from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconAlertTriangle, IconChevronLeft } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/common/container";
import { PageHeader, PageHeaderStart } from "@/components/common/page-header";
import { formatPatternSummary } from "./constants";
import { PatternAvatar } from "./pattern-avatar";
import { LockBadge, TemplateBadge } from "./pattern-badges";
import { academicPatternsListPath } from "./pattern-path";
import { PatternSettingsSection } from "./sections/pattern-settings-section";
import { StagesSection } from "./sections/stages-section";

export function AcademicPatternDetailPage() {
	const { orgSlug, patternId } = useParams<{
		orgSlug: string;
		patternId: string;
	}>();

	const pattern = useQuery(
		api.academicPatterns.getById,
		patternId ? { id: patternId as Id<"academicPatterns"> } : "skip",
	);

	if (pattern === undefined) {
		return (
			<Container>
				<AcademicPatternDetailSkeleton />
			</Container>
		);
	}

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<Button
						nativeButton={false}
						variant="ghost"
						size="sm"
						className="-ml-2 rounded-full h-8 px-2 text-muted-foreground"
						render={<Link href={academicPatternsListPath(orgSlug)} />}
					>
						<IconChevronLeft className="size-4" />
						Academic patterns
					</Button>
				</PageHeaderStart>
			</PageHeader>
			<div className="mx-auto max-w-3xl space-y-4">
				<div className="space-y-6">
					{/** Header **/}
					<div className="flex items-start gap-4">
						<PatternAvatar name={pattern.name} size="xl" />
						<div className="min-w-0 space-y-1.5">
							<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
								{pattern.name}
							</h1>
							<p className="text-sm text-muted-foreground">
								{formatPatternSummary(
									pattern.systemType,
									pattern.durationInYears,
									pattern.stages.length,
								)}
							</p>
							<div className="flex flex-wrap items-center gap-2 pt-0.5">
								<TemplateBadge templateKey={pattern.templateKey} />
								<LockBadge locked={!pattern.canBeEdited} />
							</div>
						</div>
					</div>

					{!pattern.canBeEdited && (
						<Alert variant="warning">
							<IconAlertTriangle />
							<AlertTitle>Pattern structure is locked</AlertTitle>
							<AlertDescription>
								Core structure is locked because an institution uses this
								pattern. You can still update the pattern name, description, and
								stage labels.
							</AlertDescription>
						</Alert>
					)}
				</div>

				<PatternSettingsSection
					key={`settings-${pattern._id}-${pattern.name}-${pattern.systemType}-${pattern.durationInYears}-${pattern.canBeEdited}`}
					pattern={pattern}
				/>
				<StagesSection
					key={`stages-${pattern._id}-${pattern.stages.length}`}
					stages={pattern.stages}
				/>
			</div>
		</Container>
	);
}

function AcademicPatternDetailSkeleton() {
	return (
		<div className="mx-auto max-w-3xl space-y-10">
			<div className="space-y-6">
				<Skeleton className="h-8 w-40" />
				<div className="flex items-start gap-4">
					<Skeleton className="size-14 rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-56" />
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-5 w-32 rounded-full" />
					</div>
				</div>
			</div>
			<div className="space-y-8">
				<div className="space-y-2">
					<Skeleton className="ml-1 h-4 w-16" />
					<ItemGroup className="bg-card">
						{Array.from({ length: 2 }).map((_, index) => (
							<Item
								key={index}
								className="border-x-0 border-t-0 last:border-b-0 rounded-none border-border!"
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
				<div className="space-y-2">
					<Skeleton className="ml-1 h-4 w-14" />
					<ItemGroup className="bg-card">
						{Array.from({ length: 2 }).map((_, index) => (
							<Item
								key={index}
								className="border-x-0 border-t-0 last:border-b-0 rounded-none border-border!"
							>
								<ItemContent className="space-y-3 py-1">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
									<Skeleton className="h-8 w-full" />
								</ItemContent>
							</Item>
						))}
					</ItemGroup>
				</div>
			</div>
		</div>
	);
}
