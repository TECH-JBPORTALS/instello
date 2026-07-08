import { describe, expect, vi } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	createProgramInput,
	EXPECTED_PROGRAMS_INS1,
	expectAppError,
	institutionTest,
	OWNER_1_NAME,
	PROGRAM_CS,
	programTest,
	withSlug,
} from "./fixtures/index.setup";

describe("programs.create", () => {
	const test = institutionTest();

	test("rejects unthencticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.mutation(api.programs.create, withSlug(ins1, createProgramInput())),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("creates program for active institution", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const programId = await asOwner(user1, ins1).mutation(
			api.programs.create,
			withSlug(ins1, createProgramInput()),
		);

		expect(programId).toBeDefined();

		const insertedPrograms = await t.run((ctx) =>
			ctx.db.query("programs").collect(),
		);

		expect(insertedPrograms).toMatchObject([
			{ name: PROGRAM_CS.name, alias: PROGRAM_CS.alias },
		]);
	});

	test("rejects duplicate alias within the same institution", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programs.create,
			withSlug(ins1, createProgramInput()),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programs.create,
				withSlug(
					ins1,
					createProgramInput({
						name: "Another Computer Science",
					}),
				),
			),
			ERROR_CODES.PROGRAM.ALIAS_ALREADY_EXISTS,
		);

		const insertedPrograms = await t.run((ctx) =>
			ctx.db.query("programs").collect(),
		);

		expect(insertedPrograms).toHaveLength(1);
	});
});

describe("programs.checkAlias", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.query(api.programs.checkAlias, withSlug(ins1, { alias: "CS" })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("returns available when alias is not taken", async ({
		user1,
		ins1,
		asOwner,
		programs: _programs,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.programs.checkAlias,
			withSlug(ins1, { alias: "unique-alias" }),
		);

		expect(result).toEqual({ available: true });
	});

	test("returns unavailable when alias already exists", async ({
		user1,
		ins1,
		asOwner,
		programs,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.programs.checkAlias,
			withSlug(ins1, { alias: programs.cs.alias }),
		);

		expect(result).toEqual({ available: false });
	});
});

describe("programs.getByAlias", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(
				api.programs.getByAlias,
				withSlug(ins1, { alias: programs.cs.alias }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets program by alias", async ({ user1, ins1, programs, asOwner }) => {
		const program = await asOwner(user1, ins1).query(
			api.programs.getByAlias,
			withSlug(ins1, { alias: programs.cs.alias }),
		);

		expect(program).toMatchObject({
			_id: programs.cs._id,
			name: PROGRAM_CS.name,
			alias: PROGRAM_CS.alias,
			status: "active",
		});
	});

	test("throws error if program alias doesn't exist", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.programs.getByAlias,
				withSlug(ins1, { alias: "nonexistent" }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.programs.getByAlias,
				withSlug(ins1, { alias: programs.ce.alias }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("programs.list", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.query(api.programs.list, withSlug(ins1, {})),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists programs for the active institution ordered by name", async ({
		user1,
		ins1,
		asOwner,
		programs: _programs,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.programs.list,
			withSlug(ins1, {}),
		);

		expect(result).toHaveLength(2);
		expect(result).toMatchObject(EXPECTED_PROGRAMS_INS1);
	});

	test("lists programs by name for given query", async ({
		user1,
		ins1,
		asOwner,
		programs: _programs,
	}) => {
		const query1 = await asOwner(user1, ins1).query(
			api.programs.list,
			withSlug(ins1, { query: "computer" }),
		);

		expect(query1).toHaveLength(1);
		expect(query1).toMatchObject([
			{
				name: PROGRAM_CS.name,
				alias: PROGRAM_CS.alias,
				status: "active",
				user: { name: OWNER_1_NAME },
			},
		]);

		const query2 = await asOwner(user1, ins1).query(
			api.programs.list,
			withSlug(ins1, { query: "some rubbish!" }),
		);
		expect(query2).toHaveLength(0);
		expect(query2).toMatchObject([]);
	});
});

describe("programs.getById", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(api.programs.getById, withSlug(ins1, { id: programs.me._id })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets program by id", async ({ user1, ins1, programs, asOwner }) => {
		const program = await asOwner(user1, ins1).query(
			api.programs.getById,
			withSlug(ins1, { id: programs.cs._id }),
		);

		expect(program).toMatchObject({
			name: PROGRAM_CS.name,
			alias: PROGRAM_CS.alias,
			status: "active",
		});
	});

	test("throws error if program doesn't exists", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const programId = await t.run(async (ctx) => {
			await ctx.db.delete("programs", programs.me._id);
			return programs.me._id;
		});

		await expectAppError(
			asOwner(user1, ins1).query(
				api.programs.getById,
				withSlug(ins1, { id: programId }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.programs.getById,
				withSlug(ins1, { id: programs.ce._id }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("programs.updateName", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.mutation(
				api.programs.updateName,
				withSlug(ins1, {
					id: programs.me._id,
					body: { name: "New program name" },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("updates program name", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programs.updateName,
			withSlug(ins1, {
				id: programs.cs._id,
				body: { name: "Computer Science & Engineering" },
			}),
		);

		const patchedProgram = await t.run((ctx) =>
			ctx.db.get("programs", programs.cs._id),
		);

		expect(patchedProgram).toMatchObject({
			name: "Computer Science & Engineering",
			alias: programs.cs.alias,
			status: programs.cs.status,
		});
	});

	test("throws error if trying to update name for non existing program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const programId = await t.run(async (ctx) => {
			await ctx.db.delete("programs", programs.cs._id);
			return programs.cs._id;
		});

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programs.updateName,
				withSlug(ins1, {
					id: programId,
					body: { name: "Computer Science & Engineering" },
				}),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("programs.updateAlias", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.mutation(
				api.programs.updateName,
				withSlug(ins1, {
					id: programs.me._id,
					body: { name: "New program name" },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("updates program alias", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programs.updateAlias,
			withSlug(ins1, {
				id: programs.cs._id,
				body: { alias: "CSE" },
			}),
		);

		const patchedProgram = await t.run((ctx) =>
			ctx.db.get("programs", programs.cs._id),
		);

		expect(patchedProgram).toMatchObject({
			name: programs.cs.name,
			alias: "CSE",
			status: programs.cs.status,
		});
	});

	test("throws error if trying to update alias for non existing program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const programId = await t.run(async (ctx) => {
			await ctx.db.delete("programs", programs.cs._id);
			return programs.cs._id;
		});

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programs.updateAlias,
				withSlug(ins1, {
					id: programId,
					body: { alias: "CSE" },
				}),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});

	test("rejects duplicate alias on update", async ({
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programs.updateAlias,
				withSlug(ins1, {
					id: programs.cs._id,
					body: { alias: programs.me.alias },
				}),
			),
			ERROR_CODES.PROGRAM.ALIAS_ALREADY_EXISTS,
		);
	});
});

describe("programs.remove", () => {
	const test = programTest();

	test("rejects unauthenticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.mutation(api.programs.remove, withSlug(ins1, { id: programs.cs._id })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("marks program deleting and hides it from getByAlias", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programs.remove,
			withSlug(ins1, { id: programs.cs._id }),
		);

		const deleted = await t.run((ctx) =>
			ctx.db.get("programs", programs.cs._id),
		);
		expect(deleted?.isDeleting).toBe(true);

		await expectAppError(
			asOwner(user1, ins1).query(
				api.programs.getByAlias,
				withSlug(ins1, { alias: PROGRAM_CS.alias }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);

		await expectAppError(
			asOwner(user1, ins1).query(
				api.programs.getById,
				withSlug(ins1, { id: programs.cs._id }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);

		const listed = await asOwner(user1, ins1).query(
			api.programs.list,
			withSlug(ins1, {}),
		);
		expect(listed.find((p) => p._id === programs.cs._id)).toBeUndefined();
	});

	test("cascade eventually deletes the program document", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		vi.useFakeTimers();
		try {
			await asOwner(user1, ins1).mutation(
				api.programs.remove,
				withSlug(ins1, { id: programs.me._id }),
			);

			await t.finishAllScheduledFunctions(vi.runAllTimers);

			const gone = await t.run((ctx) =>
				ctx.db.get("programs", programs.me._id),
			);
			expect(gone).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});
});
