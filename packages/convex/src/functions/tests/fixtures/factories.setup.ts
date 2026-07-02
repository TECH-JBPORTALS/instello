import type { Id } from "../../../_generated/dataModel";
import {
	CLASS_1,
	FACULTY_EMAIL,
	FACULTY_PHONE,
	FACULTY_STAFF_ID,
	PROGRAM_CS,
	SUBJECT_MATH,
} from "./constants.setup";

export const createFacultyInput = (
	overrides?: Partial<{
		staffId: string;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		email: string;
		designation: string;
		qualification: string;
		specialization: string;
		phoneNumber: string;
	}>,
) => ({
	staffId: FACULTY_STAFF_ID,
	firstName: "Jane",
	lastName: "Doe",
	dateOfBirth: "1990-05-15",
	email: FACULTY_EMAIL,
	designation: "Professor",
	qualification: "Ph.D.",
	specialization: "Computer Science",
	phoneNumber: FACULTY_PHONE,
	...overrides,
});

export type CreateFacultyInput = ReturnType<typeof createFacultyInput>;

export const createProgramInput = (
	overrides?: Partial<{ name: string; alias: string }>,
) => ({
	name: PROGRAM_CS.name,
	alias: PROGRAM_CS.alias,
	...overrides,
});

export const createSubjectInput = (
	overrides?: Partial<{
		name: string;
		code: string;
		alias: string;
		color: string;
		description: string;
	}>,
) => ({
	name: SUBJECT_MATH.name,
	code: SUBJECT_MATH.code,
	alias: SUBJECT_MATH.alias,
	color: SUBJECT_MATH.color,
	...overrides,
});

export type CreateSubjectInput = ReturnType<typeof createSubjectInput>;

export const createClassBody = (
	currentHeadStageId: Id<"academicStages">,
	overrides?: Partial<{
		name: string;
		slug: string;
		description: string;
		currentHeadStageId: Id<"academicStages">;
	}>,
) => ({
	name: CLASS_1.name,
	slug: CLASS_1.slug,
	description: CLASS_1.description,
	currentHeadStageId,
	...overrides,
});

export const STUDENT_USN = "1MS21CS001";
export const STUDENT_EMAIL = "student@example.com";
export const STUDENT_PHONE = "9876543210";

export const createStudentInput = (
	classId: Id<"classes">,
	categoryId: Id<"institutionStudentCategories">,
	overrides?: Partial<{
		classId: Id<"classes">;
		firstName: string;
		lastName: string;
		usn: string;
		email: string;
		gender: "male" | "female" | "others";
		categoryId: Id<"institutionStudentCategories">;
		phoneNumber: string;
		apaarId: string;
	}>,
) => ({
	classId,
	firstName: "Rahul",
	lastName: "Kumar",
	usn: STUDENT_USN,
	email: STUDENT_EMAIL,
	gender: "male" as const,
	categoryId,
	phoneNumber: STUDENT_PHONE,
	...overrides,
});

export type CreateStudentInput = ReturnType<typeof createStudentInput>;
