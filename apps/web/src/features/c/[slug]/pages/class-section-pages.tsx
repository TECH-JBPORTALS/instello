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
import { TimetableEditorView } from "@/features/c/[slug]/timetable/timetable-editor-view";
import { TimetableHistoryView } from "@/features/c/[slug]/timetable/timetable-history-view";
import { TimetableView } from "@/features/c/[slug]/timetable/timetable-view";
import { classPath } from "@/features/classes/class-path";
import { StudentsView } from "@/features/students/students-view";
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
	return <StudentsView />;
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
		<TimetableView basePath={classPath(programAlias, classSlug, "timetable")} />
	);
}

export function TimetableEditorPage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	return (
		<TimetableEditorView
			basePath={classPath(programAlias, classSlug, "timetable")}
		/>
	);
}

export function TimetableHistoryPage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	return (
		<TimetableHistoryView
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
