import { ConvexError } from "convex/values";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formInstitutionUrl } from "../utils";

describe("formInstitutionUrl", () => {
	const originalSiteUrl = process.env.SITE_URL;

	afterEach(() => {
		if (originalSiteUrl === undefined) {
			delete process.env.SITE_URL;
		} else {
			process.env.SITE_URL = originalSiteUrl;
		}
		vi.restoreAllMocks();
	});

	it("replaces the app subdomain with the given slug", () => {
		process.env.SITE_URL = "https://app.instello.in";
		expect(formInstitutionUrl("dsit")).toBe("https://dsit.instello.in/");
	});

	it("preserves the port in local development", () => {
		process.env.SITE_URL = "http://app.localtest.me:3000";
		expect(formInstitutionUrl("demo")).toBe("http://demo.localtest.me:3000/");
	});

	it("throws when SITE_URL is not configured", () => {
		delete process.env.SITE_URL;
		expect(() => formInstitutionUrl("demo")).toThrow(ConvexError);
		expect(() => formInstitutionUrl("demo")).toThrow(
			"SITE_URL not set in the convex dashboard",
		);
	});
});
