import { ORGANIZATION_ERROR_CODES } from "better-auth/client/plugins";

export const ERROR_CODES = {
	UNAUTHORIZED: { cause: "UNAUTHORIZED", message: "Unauthorized access" },
	/** Better auth organization error codes */
	ORGANIZATION_ERROR_CODES,
} as const;
