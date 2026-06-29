export const FACULTY_STATUS_TABS = ["active", "inactive"] as const;

export type FacultyStatusTab = (typeof FACULTY_STATUS_TABS)[number];

export const ADD_FACULTY_STEPS = [
	"Personal info",
	"Address",
	"Contact",
] as const;

export const FACULTY_LIST_PAGE_SIZE = 20;
