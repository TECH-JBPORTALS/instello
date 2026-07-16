"use client";

import { AttendanceRegisterView } from "@/features/c/[slug]/attendance/attendance-register-view";
import { AttendanceView } from "@/features/c/[slug]/attendance/attendance-view";
import { classPath } from "@/features/classes/class-path";
import { StudentsListPage } from "@/features/students/pages/students-list-page";
import { ClassTimetableEditorPage } from "@/features/timetable/pages/class-timetable-editor-page";
import { ClassTimetableHistoryPage } from "@/features/timetable/pages/class-timetable-history-page";
import { ClassTimetablePage } from "@/features/timetable/pages/class-timetable-page";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function StudentsPage() {
	return <StudentsListPage />;
}

export { ClassSubjectsPage as SubjectsPage } from "@/features/class-subjects/pages/class-subjects-page";

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
