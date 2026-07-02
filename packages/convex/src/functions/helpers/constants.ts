import { BASE_ERROR_CODES } from "better-auth";
import { ORGANIZATION_ERROR_CODES } from "better-auth/client/plugins";
import { ConvexError } from "convex/values";

export type AppErrorCode = {
	readonly code: string;
	readonly message: string;
};

export const RESERVED_SUBDOMAINS = new Set([
	"app",
	"www",
	"api",
	"docs",
	"blog",
]);

export const ERROR_CODES = {
	BASE: {
		/* Better auth base error codes merged with our customized error codes */
		...BASE_ERROR_CODES,
		UNAUTHORIZED: { code: "UNAUTHORIZED", message: "Unauthorized access" },
		ACCESS_DENIED: { code: "ACCESS_DENIED", message: "Access denied" },
		INVALID_PHONE: {
			code: "INVALID_PHONE",
			message: "Enter a valid 10-digit Indian mobile number",
		},
		INSITUTION_CODE_ALREADY_EXISTS: {
			code: "INSITUTION_CODE_ALREADY_EXISTS",
			message: "Institution code already exists",
		},
		INSITUTION_SLUG_RESERVED: {
			code: "INSITUTION_SLUG_RESERVED",
			message: "Institution slug reserved. Please use different one.",
		},
	},
	PROGRAM: {
		NOT_FOUND: {
			code: "PROGRAM_NOT_FOUND",
			message: "Program not found",
		},
		ALIAS_ALREADY_EXISTS: {
			code: "PROGRAM_ALIAS_ALREADY_EXISTS",
			message: "Program alias already exists in this institution",
		},
	},
	CLASS: {
		NOT_FOUND: {
			code: "CLASS_NOT_FOUND",
			message: "Class not found",
		},
		NAME_ALREADY_EXISTS: {
			code: "CLASS_NAME_ALREADY_EXISTS",
			message: "Class name already exists in this program",
		},
		SLUG_ALREADY_EXISTS: {
			code: "CLASS_SLUG_ALREADY_EXISTS",
			message: "Class slug already exists in this program",
		},
		INVALID_SLUG: {
			code: "CLASS_INVALID_SLUG",
			message: "Class slug must contain at least one alphanumeric character",
		},
	},
	FACULTY: {
		NOT_FOUND: {
			code: "FACULTY_NOT_FOUND",
			message: "Faculty not found",
		},
		EMAIL_ALREADY_EXISTS: {
			code: "FACULTY_EMAIL_ALREADY_EXISTS",
			message: "Faculty email already exists in this institution",
		},
		STAFF_ID_ALREADY_EXISTS: {
			code: "FACULTY_STAFF_ID_ALREADY_EXISTS",
			message: "Faculty staff ID already exists in this institution",
		},
	},
	SUBJECT: {
		NOT_FOUND: {
			code: "SUBJECT_NOT_FOUND",
			message: "Subject not found",
		},
		ALIAS_ALREADY_EXISTS: {
			code: "SUBJECT_ALIAS_ALREADY_EXISTS",
			message: "Subject alias already exists in this institution",
		},
		CODE_ALREADY_EXISTS: {
			code: "SUBJECT_CODE_ALREADY_EXISTS",
			message: "Subject code already exists in this institution",
		},
	},
	STUDENT: {
		NOT_FOUND: {
			code: "STUDENT_NOT_FOUND",
			message: "Student not found",
		},
		USN_ALREADY_EXISTS: {
			code: "STUDENT_USN_ALREADY_EXISTS",
			message: "Student USN already exists",
		},
		EMAIL_ALREADY_EXISTS: {
			code: "STUDENT_EMAIL_ALREADY_EXISTS",
			message: "Student email already exists in this institution",
		},
		INVALID_APAAR_ID: {
			code: "STUDENT_INVALID_APAAR_ID",
			message: "APAAR ID must be exactly 12 digits",
		},
		CATEGORY_NOT_FOUND: {
			code: "STUDENT_CATEGORY_NOT_FOUND",
			message: "Student category not found in this institution",
		},
	},
	INSTITUTION_STUDENT_CATEGORY: {
		NOT_FOUND: {
			code: "INSTITUTION_STUDENT_CATEGORY_NOT_FOUND",
			message: "Institution student category not found",
		},
	},
	SEED: {
		NOT_ALLOWED_IN_PRODUCTION: {
			code: "SEED_NOT_ALLOWED_IN_PRODUCTION",
			message: "You can't seed in production environment",
		},
	},
	OWNER_ORGANIZATION: {
		NOT_FOUND: {
			code: "OWNER_ORGANIZATION_NOT_FOUND",
			message: "Owner organization not found",
		},
		ALREADY_EXISTS: {
			code: "OWNER_ORGANIZATION_ALREADY_EXISTS",
			message: "Owner organization already exists for this user",
		},
	},
	ACADEMIC_PATTERN: {
		NOT_FOUND: {
			code: "ACADEMIC_PATTERN_NOT_FOUND",
			message: "Academic pattern not found",
		},
		NOT_EDITABLE: {
			code: "ACADEMIC_PATTERN_NOT_EDITABLE",
			message: "Academic pattern cannot be edited while in use",
		},
		IN_USE: {
			code: "ACADEMIC_PATTERN_IN_USE",
			message: "Academic pattern is in use by an institution",
		},
	},
	ACADEMIC_STAGE: {
		NOT_FOUND: {
			code: "ACADEMIC_STAGE_NOT_FOUND",
			message: "Academic stage not found",
		},
		NOT_EDITABLE: {
			code: "ACADEMIC_STAGE_NOT_EDITABLE",
			message: "Academic stage cannot be edited while its pattern is in use",
		},
	},
	INSTITUTION_ACADEMIC_PATTERN: {
		NOT_FOUND: {
			code: "INSTITUTION_ACADEMIC_PATTERN_NOT_FOUND",
			message: "Institution has not adopted an academic pattern",
		},
		ALREADY_ADOPTED: {
			code: "INSTITUTION_ACADEMIC_PATTERN_ALREADY_ADOPTED",
			message: "Institution has already adopted an academic pattern",
		},
	},
	/** Better auth organization error codes */
	ORGANIZATION: ORGANIZATION_ERROR_CODES,
} as const;

export function throwAppError(error: AppErrorCode): never {
	throw new ConvexError({ code: error.code, message: error.message });
}
