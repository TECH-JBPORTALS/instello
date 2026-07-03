export const STUDENT_LIST_PAGE_SIZE = 20;

export const ADD_STUDENT_STEPS = [
	"Personal",
	"Academic",
	"Contact",
	"Family",
] as const;

export const GENDER_OPTIONS = ["male", "female", "others"] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number];

export const GENDER_LABELS: Record<GenderOption, string> = {
	male: "Male",
	female: "Female",
	others: "Others",
};

export const STUDENT_IMPORT_COLUMNS = [
	"usn",
	"first_name",
	"last_name",
	"email",
	"gender",
	"category",
	"phone_number",
	"apaar_id",
	"father_name",
	"father_phone_number",
	"mother_name",
	"mother_phone_number",
	"address_line",
	"city",
	"state",
	"postal_code",
] as const;

export const STUDENT_IMPORT_TEMPLATE_CSV = [
	STUDENT_IMPORT_COLUMNS.join(","),
	[
		"1MS21CS001",
		"Rahul",
		"Kumar",
		"rahul.kumar@example.com",
		"male",
		"GM",
		"9876543210",
		"123456789012",
		"Suresh Kumar",
		"9876543211",
		"Lakshmi Kumar",
		"9876543212",
		"123 MG Road",
		"Bengaluru",
		"Karnataka",
		"560001",
	].join(","),
].join("\n");

export function downloadStudentImportTemplate() {
	const blob = new Blob([STUDENT_IMPORT_TEMPLATE_CSV], {
		type: "text/csv;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "students-import-template.csv";
	link.click();
	URL.revokeObjectURL(url);
}
