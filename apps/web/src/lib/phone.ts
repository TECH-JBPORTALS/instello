import * as v from "valibot";

/** Indian mobile: 10 digits starting with 6–9; optional +91/91 prefix. */
export const INDIAN_PHONE_REGEX = /^(\+91|91)?[6-9]\d{9}$/;

export const INDIAN_PHONE_ERROR_MESSAGE =
	"Enter a valid 10-digit Indian mobile number";

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
		throw new Error(INDIAN_PHONE_ERROR_MESSAGE);
	}

	return normalized.replace(/^(\+91|91)/, "");
}

/** Validates user input without mutating the displayed value. */
export const indianPhoneNumberInputSchema = v.pipe(
	v.string(),
	v.nonEmpty("Phone number is required"),
	v.check(
		(value) => isValidIndianPhoneNumber(value),
		INDIAN_PHONE_ERROR_MESSAGE,
	),
);

/** Validates and normalizes to a 10-digit stored value (imports, etc.). */
export const indianPhoneNumberSchema = v.pipe(
	indianPhoneNumberInputSchema,
	v.transform((value) => formatIndianPhoneNumberForStorage(value)),
);

/** Validates user input for optional phone fields; empty values are allowed. */
export const optionalIndianPhoneNumberInputSchema = v.pipe(
	v.string(),
	v.check(
		(value) => value.trim() === "" || isValidIndianPhoneNumber(value),
		INDIAN_PHONE_ERROR_MESSAGE,
	),
);
