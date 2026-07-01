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
import ClassesView from "@/features/classes/classes-view";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";

function ProgramSectionPage({
	title,
	description,
}: {
	title: string;
	description: string;
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

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>{title}</PageHeaderTitle>
					<PageHeaderDescription>
						{description} for <i className="text-foreground">{program?.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>
		</Container>
	);
}

export function ClassesPage() {
	return <ClassesView />;
}

export function SubjectsPage() {
	return (
		<ProgramSectionPage
			title="Alloted Subjects"
			description="Manage alloted subjects"
		/>
	);
}

export function FacultyPage() {
	return <ProgramSectionPage title="Faculty" description="Manage faculty" />;
}

export function TimetablesPage() {
	return (
		<ProgramSectionPage title="Timetables" description="Manage timetables" />
	);
}

export function AttendancePage() {
	return (
		<ProgramSectionPage title="Attendance" description="Manage attendance" />
	);
}
