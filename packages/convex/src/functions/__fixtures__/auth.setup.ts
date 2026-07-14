import { ERROR_CODES } from "@/helpers/constants";
import { expectAppError } from "./assertions.setup";

export const expectUnauthorized = {
	query: (promise: Promise<unknown>) =>
		expectAppError(promise, ERROR_CODES.BASE.UNAUTHORIZED),
	mutation: (promise: Promise<unknown>) =>
		expectAppError(promise, ERROR_CODES.BASE.UNAUTHORIZED),
	action: (promise: Promise<unknown>) =>
		expectAppError(promise, ERROR_CODES.BASE.UNAUTHORIZED),
} as const;

export function ownerIdentity(userId: string, institutionId: string) {
	return {
		subject: userId,
		activeInstitutionId: institutionId,
		sessionId: "ses-owner",
	};
}

export function withSlug<T extends Record<string, unknown>>(
	institution: { slug: string },
	args: T,
): T & { slug: string } {
	return { ...args, slug: institution.slug };
}
