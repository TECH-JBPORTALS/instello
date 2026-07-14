"use client";

import { api } from "@instello/convex/api";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { AttendanceRegisterView } from "@/features/c/[slug]/attendance/attendance-register-view";
import { AttendanceView } from "@/features/c/[slug]/attendance/attendance-view";
import { classPath } from "@/features/classes/class-path";
import { StudentsListPage } from "@/features/students/pages/students-list-page";
import { ClassTimetableEditorPage } from "@/features/timetable/pages/class-timetable-editor-page";
import { ClassTimetableHistoryPage } from "@/features/timetable/pages/class-timetable-history-page";
import { ClassTimetablePage } from "@/features/timetable/pages/class-timetable-page";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";

function ClassSectionPage({
	title,
	description,
}: {
	title: string;
	description: ReactNode;
}) {
	const convex = useConvex();
	const institutionSlug = useInstitutionSlug();
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});

	useEffect(() => {
		if (!programAlias || !classSlug || !institutionSlug || !program) return;

		convex
			.query(api.class.queries.getBySlug, {
				slug: institutionSlug,
				programId: program._id,
				classSlug,
			})
			.catch((error: unknown) => {
				if (
					error instanceof ConvexError &&
					error.data?.code === "CLASS_NOT_FOUND"
				) {
					notFound();
				}
			});
	}, [classSlug, convex, institutionSlug, program, programAlias]);

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>{title}</PageHeaderTitle>
					<PageHeaderDescription>{description}</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>
		</Container>
	);
}

export function StudentsPage() {
	return <StudentsListPage />;
}

export function SubjectsPage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});
	const cls = useInsQuery(
		api.class.queries.getBySlug,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);

	return (
		<ClassSectionPage
			title="Subjects"
			description={
				<>
					Manage subjects for{" "}
					<i className="text-foreground">{cls?.name ?? "this class"}</i> in{" "}
					<i className="text-foreground">{program?.name}</i>
					{cls?.currentHeadStage ? (
						<>
							{" "}
							for the current semester (
							<i className="text-foreground">{cls.currentHeadStage.name}</i>)
						</>
					) : null}
				</>
			}
		/>
	);
}

export function TimetablePage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	return (
		<ClassTimetablePage
			basePath={classPath(programAlias, classSlug, "timetable")}
		/>
	);
}

export function TimetableEditorPage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	return (
		<ClassTimetableEditorPage
			basePath={classPath(programAlias, classSlug, "timetable")}
		/>
	);
}

export function TimetableHistoryPage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	return (
		<ClassTimetableHistoryPage
			basePath={classPath(programAlias, classSlug, "timetable")}
		/>
	);
}

export function AttendancePage() {
	return <AttendanceView />;
}

export function AttendanceRegisterDetailPage() {
	return <AttendanceRegisterView />;
}

export { ClassSettingsPage } from "@/features/classes/pages/class-settings-page";
