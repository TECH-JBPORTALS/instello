"use client";

import { programFacultyListPath } from "@/features/faculty/faculty-path";
import { FacultyDetailPage } from "@/features/faculty/pages/faculty-detail-page";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function ProgramFacultyDetailPage() {
	const programAlias = useProgramAlias();

	return <FacultyDetailPage listHref={programFacultyListPath(programAlias)} />;
}
