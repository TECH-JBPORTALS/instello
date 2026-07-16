import type { Id } from "@instello/convex/dataModel";
import { programPath } from "@/features/programs/program-path";

export function facultyPath(facultyId: Id<"faculty"> | string) {
	return `/faculty/${facultyId}`;
}

export function facultyListPath() {
	return "/faculty";
}

export function programFacultyPath(
	programAlias: string,
	facultyId: Id<"faculty"> | string,
) {
	return programPath(programAlias, `faculty/${facultyId}`);
}

export function programFacultyListPath(programAlias: string) {
	return programPath(programAlias, "faculty");
}
