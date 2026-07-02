export const FACULTY_STATUS_TABS = ["active", "inactive"] as const;

export type FacultyStatusTab = (typeof FACULTY_STATUS_TABS)[number];

export const ADD_FACULTY_STEPS = [
	"Personal info",
	"Employment",
	"Contact",
] as const;

export const FACULTY_LIST_PAGE_SIZE = 20;

export const FACULTY_IMPORT_COLUMNS = [
	"staff_id",
	"first_name",
	"last_name",
	"date_of_birth",
	"email",
	"designation",
	"qualification",
	"specialization",
	"joined_date",
	"phone_number",
] as const;

export const FACULTY_IMPORT_TEMPLATE_CSV = [
	FACULTY_IMPORT_COLUMNS.join(","),
	[
		"STAFF-001",
		"Jane",
		"Doe",
		"1990-05-15",
		"jane.doe@example.com",
		"Professor",
		"Ph.D.",
		"Computer Science",
		"2020-01-15",
		"+919876543210",
	].join(","),
].join("\n");

export const FACULTY_IMPORT_TEMPLATE_FILENAME = "faculty-import-template.csv";

export function downloadFacultyImportTemplate() {
	const blob = new Blob([FACULTY_IMPORT_TEMPLATE_CSV], {
		type: "text/csv;charset=utf-8;",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = FACULTY_IMPORT_TEMPLATE_FILENAME;
	link.click();
	URL.revokeObjectURL(url);
}
