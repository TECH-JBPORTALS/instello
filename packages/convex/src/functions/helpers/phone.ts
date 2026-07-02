import { ERROR_CODES, throwAppError } from "./constants";

/** Indian mobile: 10 digits starting with 6–9; optional +91/91 prefix. */
export const INDIAN_PHONE_REGEX = /^(\+91|91)?[6-9]\d{9}$/;

export function normalizeIndianPhoneNumber(value: string): string {
	return value.replace(/[\s-]/g, "");
}

export function isValidIndianPhoneNumber(value: string): boolean {
	const normalized = normalizeIndianPhoneNumber(value.trim());
	return INDIAN_PHONE_REGEX.test(normalized);
}

/** Strips country code and returns a 10-digit mobile number. */
export function formatIndianPhoneNumberForStorage(value: string): string {
	const normalized = normalizeIndianPhoneNumber(value.trim());

	if (!INDIAN_PHONE_REGEX.test(normalized)) {
		throwAppError(ERROR_CODES.BASE.INVALID_PHONE);
	}

	return normalized.replace(/^(\+91|91)/, "");
}

export function validateIndianPhoneNumber(value: string): string {
	return formatIndianPhoneNumberForStorage(value);
}
