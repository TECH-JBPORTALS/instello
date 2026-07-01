export const OWNER_1_NAME = "Walter White";
export const OWNER_1_EMAIL = "walter+test@resend.dev";
export const OWNER_2_NAME = "Rajmatha";
export const OWNER_2_EMAIL = "rajmatha+test@resend.dev";

export const FIXED_CREATED_AT = 1_700_000_000_000;

export const PROGRAM_ME = {
	name: "Mechanical Engineering",
	alias: "ME",
} as const;
export const PROGRAM_CS = { name: "Computer Science", alias: "CS" } as const;
export const PROGRAM_CE = { name: "Civil Engineering", alias: "CE" } as const;

export const CLASS_1 = {
	name: "Class 1",
	description: "Class 1 description",
} as const;

export const CLASS_2 = {
	name: "Class 2",
	description: "Class 2 description",
} as const;

export const CLASS_3 = {
	name: "Class 3",
	description: "Class 3 description",
} as const;

export const FACULTY_EMAIL = "jane.doe@example.com";
export const FACULTY_PHONE = "+919876543210";
export const FACULTY_STAFF_ID = "STAFF-001";

/** faker.seed(123) — user1 primary institution static fields */
export const INSTITUTION_USER1_PRIMARY = {
	name: "Bhuvaneshwar PU College",
	slug: "bhuvaneshwar-pu-college",
	addressLine: "7496 Darshwana Ridges",
	code: "438",
	country: "India",
	district: "Barmer",
	state: "Jammu and Kashmir",
	zipCode: "711 556",
} as const;

/** faker.seed(123) — user1 secondary institution static fields */
export const INSTITUTION_USER1_SECONDARY = {
	name: "Krishna University",
	slug: "krishna-university",
	addressLine: "332 Agniprava Keys",
	code: "430",
	country: "India",
	district: "Palwancha",
	state: "Jharkhand",
	zipCode: "348 956",
} as const;

/** faker.seed(123) — user2 primary institution static fields */
export const INSTITUTION_USER2_PRIMARY = {
	name: "Chitramala Degree College",
	slug: "chitramala-degree-college",
	addressLine: "349 Sethi Parks",
	code: "545",
	country: "India",
	district: "Mattannur",
	state: "Goa",
	zipCode: "468 565",
} as const;

/** faker.seed(123) — user2 secondary institution static fields */
export const INSTITUTION_USER2_SECONDARY = {
	name: "Jai Engineering College",
	slug: "jai-engineering-college",
	addressLine: "72150 Achari Overpass",
	code: "556",
	country: "India",
	district: "Guwahati",
	state: "Chandigarh",
	zipCode: "636 539",
} as const;

export const EXPECTED_PROGRAMS_INS1 = [
	{
		name: PROGRAM_CS.name,
		alias: PROGRAM_CS.alias,
		status: "active" as const,
		user: { name: OWNER_1_NAME },
	},
	{
		name: PROGRAM_ME.name,
		alias: PROGRAM_ME.alias,
		status: "active" as const,
		user: { name: OWNER_1_NAME },
	},
];

export const SUBJECT_MATH = {
	name: "Mathematics",
	code: "14MAT01T",
	alias: "mathematics",
	color: "#3B82F6",
} as const;

export const SUBJECT_APPLIED_SCIENCE = {
	name: "Applied Science",
	code: "15CSE09T",
	alias: "applied-science",
	color: "#F97316",
} as const;

export const SUBJECT_PHYSICS = {
	name: "Physics",
	code: "14PHY01T",
	alias: "physics",
	color: "#22C55E",
} as const;

export const EXPECTED_SUBJECTS_INS1 = [
	{
		name: SUBJECT_APPLIED_SCIENCE.name,
		code: SUBJECT_APPLIED_SCIENCE.code,
		alias: SUBJECT_APPLIED_SCIENCE.alias,
		status: "active" as const,
	},
	{
		name: SUBJECT_MATH.name,
		code: SUBJECT_MATH.code,
		alias: SUBJECT_MATH.alias,
		status: "active" as const,
	},
];
