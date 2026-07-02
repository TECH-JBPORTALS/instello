import { classPath } from "@/lib/class-path";

export function studentPath(
	programAlias: string,
	classSlug: string,
	studentId: string,
) {
	return classPath(programAlias, classSlug, `students/${studentId}`);
}

export function studentsListPath(programAlias: string, classSlug: string) {
	return classPath(programAlias, classSlug, "students");
}
