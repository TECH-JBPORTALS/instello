import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import { seedInstitutions, seedOwners, seedPrograms } from "./test.helpers";
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
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = institutions[0];

		const programId = await t
			.withIdentity({
				subject: firstIns.userId,
				activeInstitutionId: firstIns._id,
				sessionId: "ses-1",
			})
			.mutation(api.programs.create, {
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
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = institutions[0];
		const ins2 = institutions[1];

		await t.run((ctx) => seedPrograms(ctx, { user1, user2, ins1, ins2 }));

		const programs = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.query(api.programs.list, {});

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

		const ins1 = institutions[0];
		const ins2 = institutions[1];

		await t.run((ctx) => seedPrograms(ctx, { user1, user2, ins1, ins2 }));

		// Check the query string
		const query1 = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.query(api.programs.list, { query: "computer" });

		expect(query1).toHaveLength(1);
		expect(query1).toMatchObject([
			{
				name: "Computer Science",
				alias: "CS",
				status: "active",
				user: { name: "Walter White" },
			},
		]);

		// Check for random query string
		const query2 = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.programs.list, { query: "some rubbish!" });
		expect(query2).toHaveLength(0);
		expect(query2).toMatchObject([]);
	});
});

describe("programs.getById", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const programId = await t.run(async (ctx) => {
			return await ctx.db.insert("programs", {
				name: "Mechanical Engineering",
				alias: "ME",
				createdAt: Date.now(),
				updatedAt: Date.now(),
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			});
		});

		await expect(
			t.query(api.programs.getById, { id: programId }),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("gets program by id", async () => {
		const t = createTest();

		const programId = await t.run(async (ctx) => {
			return await ctx.db.insert("programs", {
				name: "Mechanical Engineering",
				alias: "ME",
				createdAt: Date.now(),
				updatedAt: Date.now(),
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			});
		});

		const programs = await t
			.withIdentity({
				subject: "user-1",
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.programs.getById, { id: programId });

		expect(programs).toMatchObject({
			name: "Mechanical Engineering",
			alias: "ME",
			status: "active",
		});
	});

	it("throws error if program doesn't exists", async () => {
		const t = createTest();

		const programId = await t.run(async (ctx) => {
			const id = await ctx.db.insert("programs", {
				name: "Mechanical Engineering",
				alias: "ME",
				createdAt: Date.now(),
				updatedAt: Date.now(),
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			});

			await ctx.db.delete("programs", id);

			return id;
		});

		await expect(
			t
				.withIdentity({
					subject: "user-1",
					activeInstitutionId: "ins-1",
					sessionId: "ses-1",
				})
				.query(api.programs.getById, { id: programId }),
		).rejects.toThrow("Program not found");
	});
});

describe("programs.updateName", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const programId = await t.run(async (ctx) => {
			return await ctx.db.insert("programs", {
				name: "Mechanical Engineering",
				alias: "ME",
				createdAt: Date.now(),
				updatedAt: Date.now(),
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			});
		});

		await expect(
			t.mutation(api.programs.updateName, {
				id: programId,
				body: { name: "New program name" },
			}),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("updates program name", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = institutions[0];
		const ins2 = institutions[1];

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
			.mutation(api.programs.updateName, {
				id: computerScience._id,
				body: { name: "Computer Science & Engineering" },
			});

		const patchedProgram = await t.run((ctx) =>
			ctx.db
				.query("programs")
				.withIndex("by_id", (q) => q.eq("_id", computerScience._id))
				.first(),
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

		const ins1 = institutions[0];
		const ins2 = institutions[1];

		const programId = await t.run(async (ctx) => {
			const programs = await seedPrograms(ctx, { user1, user2, ins1, ins2 });
			const computerScience = programs[0];
			ctx.db.delete("programs", computerScience._id);
			return computerScience._id;
		});

		await expect(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.mutation(api.programs.updateName, {
					id: programId,
					body: { name: "Computer Science & Engineering" },
				}),
		).rejects.toThrow("Program not found");
	});
});

describe("programs.updateAlias", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const programId = await t.run(async (ctx) => {
			return await ctx.db.insert("programs", {
				name: "Mechanical Engineering",
				alias: "ME",
				createdAt: Date.now(),
				updatedAt: Date.now(),
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			});
		});

		await expect(
			t.mutation(api.programs.updateName, {
				id: programId,
				body: { name: "New program name" },
			}),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("updates program alias", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = institutions[0];
		const ins2 = institutions[1];

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
			.mutation(api.programs.updateAlias, {
				id: computerScience._id,
				body: { alias: "CSE" },
			});

		const patchedProgram = await t.run((ctx) =>
			ctx.db
				.query("programs")
				.withIndex("by_id", (q) => q.eq("_id", computerScience._id))
				.first(),
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

		const ins1 = institutions[0];
		const ins2 = institutions[1];

		const programId = await t.run(async (ctx) => {
			const programs = await seedPrograms(ctx, { user1, user2, ins1, ins2 });
			const computerScience = programs[0];
			ctx.db.delete("programs", computerScience._id);
			return computerScience._id;
		});

		await expect(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.mutation(api.programs.updateAlias, {
					id: programId,
					body: { alias: "CSE" },
				}),
		).rejects.toThrow("Program not found");
	});
});
