"use client";

import { api } from "@instello/convex/api";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
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
import { ProgramClassTimetableHistoryPage } from "@/features/timetable/pages/program-class-timetable-history-page";
import { ProgramClassTimetablePage } from "@/features/timetable/pages/program-class-timetable-page";
import { ProgramTimetablesPage } from "@/features/timetable/pages/program-timetables-page";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import {
	type FeaturePreviewKey,
	getFeaturePreview,
	getFeaturePreviewTitle,
} from "@/lib/feature-previews";

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
	const program = useInsQuery(api.program.queries.getByAlias, { alias });

	useEffect(() => {
		if (!alias || !institutionSlug) return;

		convex
			.query(api.program.queries.getByAlias, { slug: institutionSlug, alias })
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

export function FacultyPage() {
	return <ProgramSectionPage title="Faculty" description="Manage faculty" />;
}

export function TimetablesPage() {
	return <ProgramTimetablesPage />;
}

export { ProgramClassTimetableHistoryPage, ProgramClassTimetablePage };

export function AttendancePage() {
	return (
		<ProgramSectionPage
			description="Manage attendance"
			featurePreview={{ key: "attendance", scope: "program" }}
			title="Attendance"
		/>
	);
}
