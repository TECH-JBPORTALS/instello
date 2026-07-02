import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "../constants";
import {
	formatIndianPhoneNumberForStorage,
	isValidIndianPhoneNumber,
	normalizeIndianPhoneNumber,
} from "../phone";

describe("phone helpers", () => {
	it("normalizes whitespace and dashes", () => {
		expect(normalizeIndianPhoneNumber("+91 98765-43210")).toBe("+919876543210");
	});

	it("accepts valid Indian mobile numbers", () => {
		expect(isValidIndianPhoneNumber("9876543210")).toBe(true);
		expect(isValidIndianPhoneNumber("+919876543210")).toBe(true);
		expect(isValidIndianPhoneNumber("919876543210")).toBe(true);
		expect(isValidIndianPhoneNumber("+91 98765 43210")).toBe(true);
	});

	it("rejects invalid numbers", () => {
		expect(isValidIndianPhoneNumber("1234567890")).toBe(false);
		expect(isValidIndianPhoneNumber("987654321")).toBe(false);
		expect(isValidIndianPhoneNumber("abcdefghij")).toBe(false);
	});

	it("stores 10-digit numbers without country code", () => {
		expect(formatIndianPhoneNumberForStorage("+919876543210")).toBe(
			"9876543210",
		);
		expect(formatIndianPhoneNumberForStorage("9876543210")).toBe("9876543210");
	});

	it("throws for invalid numbers", () => {
		expect(() => formatIndianPhoneNumberForStorage("12345")).toThrow(
			ERROR_CODES.BASE.INVALID_PHONE.message,
		);
	});
});
