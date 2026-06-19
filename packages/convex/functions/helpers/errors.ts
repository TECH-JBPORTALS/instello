import { BASE_ERROR_CODES } from "better-auth";
import { ORGANIZATION_ERROR_CODES } from "better-auth/client/plugins";

export const ERROR_CODES = {
	BASE: {
		/* Better auth base error codes merged with our customized error codes */
		...BASE_ERROR_CODES,
		UNAUTHORIZED: { code: "UNAUTHORIZED", message: "Unauthorized access" },
	},
	/** Better auth organization error codes */
	ORGANIZATION: ORGANIZATION_ERROR_CODES,
} as const;
