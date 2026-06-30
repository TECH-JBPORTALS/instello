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
	"address_line",
	"district",
	"state",
	"country",
	"zip_code",
	"profile_pic_url",
] as const;

export type FacultyImportColumn = (typeof FACULTY_IMPORT_COLUMNS)[number];

export const REQUIRED_FACULTY_IMPORT_COLUMNS = [
	"staff_id",
	"first_name",
	"last_name",
	"date_of_birth",
	"email",
	"designation",
	"qualification",
	"specialization",
	"phone_number",
	"address_line",
	"district",
	"state",
	"country",
	"zip_code",
] as const satisfies readonly FacultyImportColumn[];

export const OPTIONAL_FACULTY_IMPORT_COLUMNS = [
	"joined_date",
	"profile_pic_url",
] as const satisfies readonly FacultyImportColumn[];

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
		"123 Main St",
		"Bangalore",
		"Karnataka",
		"India",
		"560001",
		"",
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

/** File row number shown to users (1-based, header is row 1). */
export function toDisplayRow(dataRowIndex: number) {
	return dataRowIndex + 2;
}
