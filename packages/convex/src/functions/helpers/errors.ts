import { BASE_ERROR_CODES } from "better-auth";
import { ORGANIZATION_ERROR_CODES } from "better-auth/client/plugins";

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
		CLASS_NOT_FOUND: {
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
	},
	/** Better auth organization error codes */
	ORGANIZATION: ORGANIZATION_ERROR_CODES,
} as const;
