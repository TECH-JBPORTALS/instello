"use client";

import { programPath } from "@/features/programs/program-path";
import { ClassTimetableHistoryPage } from "@/features/timetable/pages/class-timetable-history-page";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function ProgramClassTimetableHistoryPage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();

	return (
		<ClassTimetableHistoryPage
			basePath={programPath(programAlias, `timetables/${classSlug}`)}
		/>
	);
}
