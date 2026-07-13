import type { Id } from "@instello/convex/dataModel";

export function facultyPath(facultyId: Id<"faculty"> | string) {
	return `/faculty/${facultyId}`;
}

export function facultyListPath() {
	return "/faculty";
}
