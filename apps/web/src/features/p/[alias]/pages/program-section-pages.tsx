"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { UpcomingFeaturePreview } from "@/components/common/upcoming-feature-preview/upcoming-feature-preview";
import { TimetableHistoryView } from "@/features/c/[slug]/timetable/timetable-history-view";
import { TimetableView } from "@/features/c/[slug]/timetable/timetable-view";
import ClassesView from "@/features/classes/classes-view";
import { ProgramSubjectAllocationView } from "@/features/p/[alias]/subjects/program-subject-allocation-view";
import { ProgramTimetablesView } from "@/features/p/[alias]/timetable/program-timetables-view";
import { getClassMockTimetableInfo } from "@/features/timetable/dummy-timetable-data";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import {
	type FeaturePreviewKey,
	getFeaturePreview,
	getFeaturePreviewTitle,
} from "@/lib/feature-previews";
import { programPath } from "@/lib/program-path";

function ProgramSectionPage({
	title,
	description,
	featurePreview,
}: {
	title: string;
	description: string;
	featurePreview?: { key: FeaturePreviewKey; scope: "program" };
}) {
	const convex = useConvex();
	const institutionSlug = useInstitutionSlug();

	const alias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias });

	useEffect(() => {
		if (!alias || !institutionSlug) return;

		convex
			.query(api.programs.getByAlias, { slug: institutionSlug, alias })
			.catch((error: unknown) => {
				if (
					error instanceof ConvexError &&
					error.data?.code === "PROGRAM_NOT_FOUND"
				) {
					notFound();
				}
			});
	}, [alias, convex, institutionSlug]);

	const previewConfig = featurePreview
		? getFeaturePreview(featurePreview.key, featurePreview.scope)
		: null;

	return (
		<Container className="relative flex min-h-0 flex-1 flex-col">
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>{title}</PageHeaderTitle>
					<PageHeaderDescription>
						{description} for <i className="text-foreground">{program?.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>
			{featurePreview ? (
				<UpcomingFeaturePreview
					featureKey={featurePreview.key}
					featureTitle={getFeaturePreviewTitle(featurePreview.key)}
					scope={featurePreview.scope}
					slides={previewConfig?.slides ?? []}
				/>
			) : null}
		</Container>
	);
}

export function ClassesPage() {
	return <ClassesView />;
}

export function SubjectsPage() {
	return <ProgramSubjectAllocationView />;
}

export function FacultyPage() {
	return <ProgramSectionPage title="Faculty" description="Manage faculty" />;
}

export function TimetablesPage() {
	return <ProgramTimetablesView />;
}

export function ProgramClassTimetablePage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const { publishInfo, versionHistory } = getClassMockTimetableInfo(classSlug);

	return (
		<>
			<Container className="pb-0">
				<PageHeader className="h-fit">
					<PageHeaderStart>
						<Button
							render={<Link href={programPath(programAlias, `timetables`)} />}
							variant={"ghost"}
							className={"rounded-full text-muted-foreground -mx-3.5"}
						>
							<IconArrowLeft /> Program Timetables
						</Button>
					</PageHeaderStart>
				</PageHeader>
			</Container>

			<TimetableView
				basePath={programPath(programAlias, `timetables/${classSlug}`)}
				publishInfo={publishInfo}
				versionHistory={versionHistory}
			/>
		</>
	);
}

export function ProgramClassTimetableHistoryPage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const { versionHistory } = getClassMockTimetableInfo(classSlug);

	return (
		<TimetableHistoryView
			basePath={programPath(programAlias, `timetables/${classSlug}`)}
			versionHistory={versionHistory}
		/>
	);
}

export function AttendancePage() {
	return (
		<ProgramSectionPage
			description="Manage attendance"
			featurePreview={{ key: "attendance", scope: "program" }}
			title="Attendance"
		/>
	);
}
