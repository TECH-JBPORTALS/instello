import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import { seedPrograms } from "./test.helpers";
import { createTest } from "./test.setup";

describe("programs.create", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		await expect(
			t.mutation(api.programs.create, {
				name: "Computer Science",
				alias: "CS",
			}),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("creates program for active institution", async () => {
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

		const programId = await t.mutation(api.programs.create, {
			name: "Computer Science",
			alias: "CS",
		});

		expect(programId).toBeDefined();

		const insertedPrograms = await t.run((ctx) =>
			ctx.db.query("programs").collect(),
		);

		expect(insertedPrograms).toMatchObject([
			{ name: "Computer Science", alias: "CS" },
		]);
	});
});

describe("programs.list", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		await expect(t.query(api.programs.list, {})).rejects.toThrow(
			ERROR_CODES.BASE.UNAUTHORIZED.message,
		);
	});

	it("lists programs for the active institution ordered by name", async () => {
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

		await t.run(seedPrograms);

		const programs = await t.query(api.programs.list, {});

		expect(programs).toHaveLength(2);
		expect(programs).toMatchObject([
			{
				name: "Computer Science",
				alias: "CS",
				status: "active",
				user: { name: "Walter White" },
			},
			{
				name: "Mechanical Engineering",
				alias: "ME",
				status: "active",
				user: { name: "Walter White" },
			},
		]);
	});

	it("lists programs by name for given query", async () => {
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

		await t.run(seedPrograms);

		const query1 = await t.query(api.programs.list, { query: "computer" });

		expect(query1).toHaveLength(1);
		expect(query1).toMatchObject([
			{
				name: "Computer Science",
				alias: "CS",
				status: "active",
				user: { name: "Walter White" },
			},
		]);

		const query2 = await t.query(api.programs.list, { query: "some rubbish!" });
		expect(query2).toHaveLength(0);
		expect(query2).toMatchObject([]);
	});
});
