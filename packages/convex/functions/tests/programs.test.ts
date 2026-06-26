import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import { createTest } from "./test.setup";

describe("programs.create", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		expect(
			t.mutation(api.programs.create, {
				name: "Computer Science",
				alias: "CS",
			}),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("creates program", async () => {
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
