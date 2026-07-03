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

const STUDENT_IMPORT_EXAMPLE_ROW = [
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
];

export const STUDENT_IMPORT_TEMPLATE_CSV = [
	STUDENT_IMPORT_COLUMNS.join(","),
	STUDENT_IMPORT_EXAMPLE_ROW.join(","),
].join("\n");

export function downloadStudentImportTemplate(includeBatch = false) {
	const columns: string[] = includeBatch
		? [
				...STUDENT_IMPORT_COLUMNS.slice(0, 6),
				"batch",
				...STUDENT_IMPORT_COLUMNS.slice(6),
			]
		: [...STUDENT_IMPORT_COLUMNS];
	const exampleRow: string[] = includeBatch
		? [
				...STUDENT_IMPORT_EXAMPLE_ROW.slice(0, 6),
				"Batch 1",
				...STUDENT_IMPORT_EXAMPLE_ROW.slice(6),
			]
		: [...STUDENT_IMPORT_EXAMPLE_ROW];

	const csv = [columns.join(","), exampleRow.join(",")].join("\n");

	const blob = new Blob([csv], {
		type: "text/csv;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "students-import-template.csv";
	link.click();
	URL.revokeObjectURL(url);
}
