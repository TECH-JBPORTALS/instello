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
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

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

		const programs = await t.query(api.programs.getById, { id: programId });

		expect(programs).toMatchObject({
			name: "Mechanical Engineering",
			alias: "ME",
			status: "active",
		});
	});

	it("throws error if program doesn't exists", async () => {
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

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
			t.query(api.programs.getById, { id: programId }),
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
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

		const programs = await t.run(seedPrograms);
		const computerScience = programs[0];

		await t.mutation(api.programs.updateName, {
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
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

		const programId = await t.run(async (ctx) => {
			const programs = await seedPrograms(ctx);
			const computerScience = programs[0];
			ctx.db.delete("programs", computerScience._id);
			return computerScience._id;
		});

		await expect(
			t.mutation(api.programs.updateName, {
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
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

		const programs = await t.run(seedPrograms);
		const computerScience = programs[0];

		await t.mutation(api.programs.updateAlias, {
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
		const t = createTest({
			subject: "user-1",
			activeInstitutionId: "ins-1",
			sessionId: "ses-1",
		});

		const programId = await t.run(async (ctx) => {
			const programs = await seedPrograms(ctx);
			const computerScience = programs[0];
			ctx.db.delete("programs", computerScience._id);
			return computerScience._id;
		});

		await expect(
			t.mutation(api.programs.updateAlias, {
				id: programId,
				body: { alias: "CSE" },
			}),
		).rejects.toThrow("Program not found");
	});
});
