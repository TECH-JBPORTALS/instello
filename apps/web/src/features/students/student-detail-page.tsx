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
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { getStudentDisplayName } from "./forms/shared-form";
import { StudentSettingsSection } from "./sections/student-settings-section";
import { StudentAvatar } from "./student-avatar";
import { studentsListPath } from "./student-path";

export function StudentDetailPage() {
	const { studentId } = useParams<{ studentId: string }>();
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const student = useInsQuery(
		api.students.getById,
		studentId ? { id: studentId as Id<"students"> } : "skip",
	);

	if (student === undefined) {
		return (
			<Container>
				<StudentDetailSkeleton />
			</Container>
		);
	}

	const displayName = getStudentDisplayName(
		student.firstName,
		student.lastName,
	);

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<Button
						nativeButton={false}
						variant="ghost"
						size="sm"
						className="-ml-2 rounded-full h-8 px-2 text-muted-foreground"
						render={<Link href={studentsListPath(programAlias, classSlug)} />}
					>
						<IconChevronLeft className="size-4" />
						Students
					</Button>
				</PageHeaderStart>
			</PageHeader>

			<div className="mx-auto max-w-3xl space-y-4">
				<div className="space-y-6">
					<div className="flex items-start gap-4">
						<StudentAvatar
							firstName={student.firstName}
							lastName={student.lastName}
							image={student.image}
							size="xl"
						/>
						<div className="min-w-0 space-y-1.5">
							<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
								{displayName}
							</h1>
							<p className="text-sm text-muted-foreground">{student.usn}</p>
							<p className="text-sm text-muted-foreground">{student.email}</p>
							<div className="flex flex-wrap items-center gap-2 pt-0.5">
								<Badge variant="secondary">{student.categoryName}</Badge>
							</div>
						</div>
					</div>
				</div>

				<StudentSettingsSection
					key={`settings-${student._id}-${student.updatedAt}`}
					student={student}
				/>
			</div>
		</Container>
	);
}

function StudentDetailSkeleton() {
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
				))}
			</div>
		</div>
	);
}
