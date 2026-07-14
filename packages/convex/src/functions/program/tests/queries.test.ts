import { describe, expect } from "vitest";
import { api } from "@/_generated/api";
import { ERROR_CODES } from "@/helpers/constants";
import {
	EXPECTED_PROGRAMS_INS1,
	expectAppError,
	OWNER_1_NAME,
	PROGRAM_CS,
	programTest,
	withSlug,
} from "@/__fixtures__/index.setup";

describe("programs.checkAlias", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.query(api.program.queries.checkAlias, withSlug(ins1, { alias: "CS" })),
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
			api.program.queries.checkAlias,
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
			api.program.queries.checkAlias,
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
				api.program.queries.getByAlias,
				withSlug(ins1, { alias: programs.cs.alias }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets program by alias", async ({ user1, ins1, programs, asOwner }) => {
		const program = await asOwner(user1, ins1).query(
			api.program.queries.getByAlias,
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
				api.program.queries.getByAlias,
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
				api.program.queries.getByAlias,
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
			t.query(api.program.queries.list, withSlug(ins1, {})),
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
			api.program.queries.list,
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
			api.program.queries.list,
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
			api.program.queries.list,
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
			t.query(
				api.program.queries.getById,
				withSlug(ins1, { id: programs.me._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets program by id", async ({ user1, ins1, programs, asOwner }) => {
		const program = await asOwner(user1, ins1).query(
			api.program.queries.getById,
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
				api.program.queries.getById,
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
				api.program.queries.getById,
				withSlug(ins1, { id: programs.ce._id }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});
