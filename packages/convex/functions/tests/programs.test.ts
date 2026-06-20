import { describe, expect, it } from "vitest";
import { api } from "~/_generated/api";
import { ERROR_CODES } from "~/helpers/errors";
import { createTest } from "./test.setup";

describe("programs.create", () => {
	// Authentication
	it("rejects unauthenticated user", async () => {
		const t = createTest(); // without identity

		const r = t.mutation(api.programs.create, {
			name: "Computer Science Engineering",
			alias: "CSE",
		});

		await expect(r).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("rejects no active insitution in the session", async () => {
		const t = createTest({ sessionId: "ses-1", subject: "user-1" });

		const r = t.mutation(api.programs.create, {
			name: "Computer Science Engineering",
			alias: "CSE",
		});

		await expect(r).rejects.toThrow(
			ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
		);
	});

	// Expectations based on the authorization
	it("creates program", async () => {
		const t = createTest({
			sessionId: "ses-1",
			subject: "user-1",
			activeInstitutionId: "ins-1",
		});

		const id = await t.mutation(api.programs.create, {
			name: "Computer Science Engineering",
			alias: "CSE",
		});

		const program = await t.run((ctx) => ctx.db.get(id));

		expect(program).toMatchObject({
			name: "Computer Science Engineering",
			alias: "CSE",
		});
	});
});

describe("programs.getById", () => {
	// Authentication
	it("rejects unauthenticated user", async () => {
		const t = createTest(); // without identity

		const id = await t.run((ctx) =>
			ctx.db.insert("programs", {
				alias: "CSE",
				name: "Computer Science Engineering",
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			}),
		);

		const r = t.query(api.programs.getById, { id });

		await expect(r).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("rejects no active insitution in the session", async () => {
		const t = createTest({ sessionId: "ses-1", subject: "user-1" });

		const id = await t.run((ctx) =>
			ctx.db.insert("programs", {
				alias: "CSE",
				name: "Computer Science Engineering",
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			}),
		);

		const r = t.query(api.programs.getById, { id });

		await expect(r).rejects.toThrow(
			ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
		);
	});

	// Expectations based on the authorization
	it("get's program with given id", async () => {
		const t = createTest({
			sessionId: "ses-1",
			subject: "user-1",
			activeInstitutionId: "ins-1",
		});

		const id = await t.run((ctx) =>
			ctx.db.insert("programs", {
				alias: "CSE",
				name: "Computer Science Engineering",
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			}),
		);

		const program = await t.query(api.programs.getById, { id });

		expect(program).toMatchObject({
			name: "Computer Science Engineering",
			alias: "CSE",
		});
	});
});
