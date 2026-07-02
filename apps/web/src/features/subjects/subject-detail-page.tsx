"use client";

import { api } from "@instello/convex/api";
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
import { SubjectSettingsSection } from "./sections/subject-settings-section";
import { SubjectAvatar } from "./subject-avatar";
import { subjectsListPath } from "./subject-path";

export function SubjectDetailPage() {
	const { subjectAlias } = useParams<{ subjectAlias: string }>();
	const subject = useInsQuery(
		api.subjects.getByAlias,
		subjectAlias ? { alias: subjectAlias } : "skip",
	);

	if (subject === undefined) {
		return (
			<Container>
				<SubjectDetailSkeleton />
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
						className="-ml-2 h-8 rounded-full px-2 text-muted-foreground"
						render={<Link href={subjectsListPath()} />}
					>
						<IconChevronLeft className="size-4" />
						Subjects
					</Button>
				</PageHeaderStart>
			</PageHeader>

			<div className="mx-auto max-w-3xl space-y-4">
				<div className="space-y-6">
					<div className="flex items-start gap-4">
						<SubjectAvatar
							name={subject.name}
							color={subject.color}
							size="xl"
						/>
						<div className="min-w-0 space-y-1.5">
							<div className="flex flex-row flex-wrap items-center gap-1.5">
								<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
									{subject.name}
								</h1>
								<Badge
									variant="secondary"
									className={cn(
										"uppercase",
										subject.status === "active"
											? "bg-success/20 text-success"
											: "bg-warning/20 text-warning",
									)}
								>
									{subject.status}
								</Badge>
							</div>
							<p className="text-sm text-muted-foreground uppercase">
								{subject.code}
							</p>
							<p className="text-sm text-muted-foreground">{subject.alias}</p>
						</div>
					</div>
				</div>

				<SubjectSettingsSection
					key={`settings-${subject._id}-${subject.updatedAt}`}
					subject={subject}
				/>
			</div>
		</Container>
	);
}

function SubjectDetailSkeleton() {
	return (
		<div className="mx-auto max-w-3xl space-y-10">
			<div className="space-y-6">
				<Skeleton className="h-8 w-28" />
				<div className="flex items-start gap-4">
					<Skeleton className="size-16 rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-56" />
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-5 w-24 rounded-full" />
					</div>
				</div>
			</div>
			<div className="space-y-2">
				<Skeleton className="ml-1 h-4 w-32" />
				<ItemGroup className="bg-card">
					{Array.from({ length: 5 }).map((_, index) => (
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
		</div>
	);
}
