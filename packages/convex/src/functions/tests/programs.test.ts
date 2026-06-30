import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import {
	primaryIns,
	secondaryIns,
	seedInstitutions,
	seedOwners,
	seedPrograms,
	withSlug,
} from "./test.helpers";
import { createTest } from "./test.setup";

describe("programs.create", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = primaryIns(institutions);

		await expect(
			t.mutation(
				api.programs.create,
				withSlug(firstIns, {
					name: "Computer Science",
					alias: "CS",
				}),
			),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("creates program for active institution", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = primaryIns(institutions);

		const programId = await t
			.withIdentity({
				subject: firstIns.userId,
				activeInstitutionId: firstIns._id,
				sessionId: "ses-1",
			})
			.mutation(
				api.programs.create,
				withSlug(firstIns, {
					name: "Computer Science",
					alias: "CS",
				}),
			);

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
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);

		await expect(
			t.query(api.programs.list, withSlug(ins1, {})),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("lists programs for the active institution ordered by name", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);

		await t.run((ctx) => seedPrograms(ctx, { user1, user2, ins1, ins2 }));

		const programs = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.query(api.programs.list, withSlug(ins1, {}));

		expect(programs).toHaveLength(2);
		expect(programs).toMatchObject([
			{
				name: "Computer Science",
				alias: "CS",
				status: "active",
				user: { name: user1.name },
			},
			{
				name: "Mechanical Engineering",
				alias: "ME",
				status: "active",
				user: { name: user1.name },
			},
		]);
	});

	it("lists programs by name for given query", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);

		await t.run((ctx) => seedPrograms(ctx, { user1, user2, ins1, ins2 }));

		const query1 = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.query(api.programs.list, withSlug(ins1, { query: "computer" }));

		expect(query1).toHaveLength(1);
		expect(query1).toMatchObject([
			{
				name: "Computer Science",
				alias: "CS",
				status: "active",
				user: { name: "Walter White" },
			},
		]);

		const query2 = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.query(api.programs.list, withSlug(ins1, { query: "some rubbish!" }));
		expect(query2).toHaveLength(0);
		expect(query2).toMatchObject([]);
	});
});

describe("programs.getById", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, {
				user1,
				user2,
				ins1,
				ins2: secondaryIns(institutions),
			}),
		);
		const programId = programs[0]._id;

		await expect(
			t.query(api.programs.getById, withSlug(ins1, { id: programId })),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("gets program by id", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = institutions[2];

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const programId = programs[1]._id;

		const program = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.query(api.programs.getById, withSlug(ins1, { id: programId }));

		expect(program).toMatchObject({
			name: "Computer Science",
			alias: "CS",
			status: "active",
		});
	});

	it("throws error if program doesn't exists", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);

		const programId = await t.run(async (ctx) => {
			const programs = await seedPrograms(ctx, {
				user1,
				user2,
				ins1,
				ins2: secondaryIns(institutions),
			});
			const id = programs[0]._id;
			await ctx.db.delete("programs", id);
			return id;
		});

		await expect(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.query(api.programs.getById, withSlug(ins1, { id: programId })),
		).rejects.toThrow(ERROR_CODES.PROGRAM.NOT_FOUND.message);
	});

	it("rejects program from another institution", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = institutions[2];

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const programInIns2 = programs[2];

		await expect(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.query(api.programs.getById, withSlug(ins1, { id: programInIns2._id })),
		).rejects.toThrow(ERROR_CODES.PROGRAM.NOT_FOUND.message);
	});
});

describe("programs.updateName", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, {
				user1,
				user2,
				ins1,
				ins2: secondaryIns(institutions),
			}),
		);

		await expect(
			t.mutation(
				api.programs.updateName,
				withSlug(ins1, {
					id: programs[0]._id,
					body: { name: "New program name" },
				}),
			),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("updates program name", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);

		const computerScience = programs[0];

		await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.mutation(
				api.programs.updateName,
				withSlug(ins1, {
					id: computerScience._id,
					body: { name: "Computer Science & Engineering" },
				}),
			);

		const patchedProgram = await t.run((ctx) =>
			ctx.db.get("programs", computerScience._id),
		);

		expect(patchedProgram).toMatchObject({
			name: "Computer Science & Engineering",
			alias: computerScience.alias,
			status: computerScience.status,
		});
	});

	it("throws error if trying to update name for non existing program", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);

		const programId = await t.run(async (ctx) => {
			const programs = await seedPrograms(ctx, { user1, user2, ins1, ins2 });
			const computerScience = programs[0];
			await ctx.db.delete("programs", computerScience._id);
			return computerScience._id;
		});

		await expect(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.mutation(
					api.programs.updateName,
					withSlug(ins1, {
						id: programId,
						body: { name: "Computer Science & Engineering" },
					}),
				),
		).rejects.toThrow(ERROR_CODES.PROGRAM.NOT_FOUND.message);
	});
});

describe("programs.updateAlias", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, {
				user1,
				user2,
				ins1,
				ins2: secondaryIns(institutions),
			}),
		);

		await expect(
			t.mutation(
				api.programs.updateName,
				withSlug(ins1, {
					id: programs[0]._id,
					body: { name: "New program name" },
				}),
			),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("updates program alias", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const computerScience = programs[0];

		await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.mutation(
				api.programs.updateAlias,
				withSlug(ins1, {
					id: computerScience._id,
					body: { alias: "CSE" },
				}),
			);

		const patchedProgram = await t.run((ctx) =>
			ctx.db.get("programs", computerScience._id),
		);

		expect(patchedProgram).toMatchObject({
			name: computerScience.name,
			alias: "CSE",
			status: computerScience.status,
		});
	});

	it("throws error if trying to update alias for non existing program", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);

		const programId = await t.run(async (ctx) => {
			const programs = await seedPrograms(ctx, { user1, user2, ins1, ins2 });
			const computerScience = programs[0];
			await ctx.db.delete("programs", computerScience._id);
			return computerScience._id;
		});

		await expect(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.mutation(
					api.programs.updateAlias,
					withSlug(ins1, {
						id: programId,
						body: { alias: "CSE" },
					}),
				),
		).rejects.toThrow(ERROR_CODES.PROGRAM.NOT_FOUND.message);
	});
});
