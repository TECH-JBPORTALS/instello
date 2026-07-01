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
	SEED: {
		NOT_ALLOWED_IN_PRODUCTION: {
			code: "SEED_NOT_ALLOWED_IN_PRODUCTION",
			message: "You can't seed in production environment",
		},
	},
	/** Better auth organization error codes */
	ORGANIZATION: ORGANIZATION_ERROR_CODES,
} as const;

export function throwAppError(error: AppErrorCode): never {
	throw new ConvexError({ code: error.code, message: error.message });
}
