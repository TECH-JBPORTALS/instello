import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "~/_generated/api";
import { ERROR_CODES } from "~/helpers/errors";
import schema from "../schema";
import { modules } from "./test.setup";

describe("programs.create", () => {
	let t: TestConvex<typeof schema>;

	beforeEach(() => {
		t = convexTest(schema, modules);
	});

	// Authentication
	it("rejects unauthenticated user", async () => {
		const r = t
			.withIdentity({}) // without identity
			.mutation(api.programs.create, {
				name: "Computer Science Engineering",
				alias: "CSE",
			});

		await expect(r).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("rejects no active insitution in the session", async () => {
		const r = t
			.withIdentity({ sessionId: "ses-1", subject: "user-1" }) // without identity
			.mutation(api.programs.create, {
				name: "Computer Science Engineering",
				alias: "CSE",
			});

		await expect(r).rejects.toThrow(
			ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
		);
	});

	// Expectations based on the authorization
	it("creates program", async () => {
		// Creates program
		const id = await t
			.withIdentity({
				sessionId: "ses-1",
				subject: "user-1",
				activeInstitutionId: "ins-1",
			}) // without identity
			.mutation(api.programs.create, {
				name: "Computer Science Engineering",
				alias: "CSE",
			});

		// Check
		const program = await t.run((ctx) => ctx.db.get(id));

		expect(program).toMatchObject({
			name: "Computer Science Engineering",
			alias: "CSE",
		});
	});
});

describe("programs.list", () => {
	let t: TestConvex<typeof schema>;

	beforeEach(() => {
		t = convexTest(schema, modules);
	});

	// Authentication
	it("rejects to list the programs for unauthenticated user", async () => {
		const r = t
			.withIdentity({}) // without identity
			.query(api.programs.list);

		await expect(r).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("rejects to list the programs if no active insitution in the session", async () => {
		const r = t
			.withIdentity({ subject: "user-1", sessionId: "ses-1" })
			.query(api.programs.list);

		await expect(r).rejects.toThrow(
			ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
		);
	});

	// Expectations based on the authorization
	it("get's all the programs for owner of current institution", () => {
		t.withIdentity({ subject: "user-1" });
	});

	it("get's all the programs for principal of current institution", () => {
		t.withIdentity({ subject: "user-1" });
	});
});
