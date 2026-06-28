import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import { seedInstitutions, seedOwners, seedPrograms } from "./test.helpers";
import { createTest } from "./test.setup";

describe("classes.create", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = institutions[0];
		const secondIns = institutions[1];
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];

		await expect(
			t.mutation(api.classes.create, {
				programId: firstProgram._id,
				body: {
					name: "Class 1",
					description: "Class 1 description",
					academicYear: 2026,
					semester: 1,
				},
			}),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("creates class for active program", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = institutions[0];
		const secondIns = institutions[1];
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];
		const secondProgram = programs[1];

		const firstClassId = await t
			.withIdentity({
				subject: firstIns.userId,
				activeInstitutionId: firstIns._id,
				sessionId: "ses-1",
			})
			.mutation(api.classes.create, {
				programId: firstProgram._id,
				body: {
					name: "Class 1",
					description: "Class 1 description",
					academicYear: 2026,
					semester: 1,
				},
			});

		const secondClassId = await t
			.withIdentity({
				subject: secondIns.userId,
				activeInstitutionId: secondIns._id,
				sessionId: "ses-1",
			})
			.mutation(api.classes.create, {
				programId: secondProgram._id,
				body: {
					name: "Class 2",
					description: "Class 2 description",
					academicYear: 2026,
					semester: 4,
				},
			});

		expect(firstClassId).toBeDefined();
		expect(secondClassId).toBeDefined();

		t.run(async (ctx) => {
			const classes = await ctx.db.query("classes").collect();
			expect(classes).toHaveLength(2);
			expect(classes).toMatchObject([
				{
					name: "Class 1",
					description: "Class 1 description",
					academicYear: 2026,
					semester: 1,
				},
				{
					name: "Class 2",
					description: "Class 2 description",
					academicYear: 2026,
					semester: 4,
				},
			]);
		});
	});
});
