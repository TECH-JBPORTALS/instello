import { describe, expect } from "vitest";
import {
	EXPECTED_SUBJECTS_INS1,
	expectAppError,
	SUBJECT_MATH,
	subjectTest,
	withSlug,
} from "@/__fixtures__/index.setup";
import { api } from "@/_generated/api";
import { ERROR_CODES } from "@/helpers/constants";

describe("subjects.checkAlias", () => {
	const test = subjectTest();

	test("rejects unauthenticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.query(
				api.subject.queries.checkAlias,
				withSlug(ins1, { alias: "mathematics" }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("returns available when alias is not taken", async ({
		user1,
		ins1,
		asOwner,
		subjects: _subjects,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.subject.queries.checkAlias,
			withSlug(ins1, { alias: "unique-alias" }),
		);

		expect(result).toEqual({ available: true });
	});

	test("returns unavailable when alias already exists", async ({
		user1,
		ins1,
		asOwner,
		subjects,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.subject.queries.checkAlias,
			withSlug(ins1, { alias: subjects.math.alias }),
		);

		expect(result).toEqual({ available: false });
	});
});

describe("subjects.checkCode", () => {
	const test = subjectTest();

	test("returns available when code is not taken", async ({
		user1,
		ins1,
		asOwner,
		subjects: _subjects,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.subject.queries.checkCode,
			withSlug(ins1, { code: "UNIQUE01T" }),
		);

		expect(result).toEqual({ available: true });
	});

	test("returns unavailable when code already exists", async ({
		user1,
		ins1,
		asOwner,
		subjects,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.subject.queries.checkCode,
			withSlug(ins1, { code: subjects.math.code }),
		);

		expect(result).toEqual({ available: false });
	});
});

describe("subjects.getByAlias", () => {
	const test = subjectTest();

	test("rejects unauthenticated user", async ({ t, ins1, subjects }) => {
		await expectAppError(
			t.query(
				api.subject.queries.getByAlias,
				withSlug(ins1, { alias: subjects.math.alias }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets subject by alias", async ({ user1, ins1, subjects, asOwner }) => {
		const subject = await asOwner(user1, ins1).query(
			api.subject.queries.getByAlias,
			withSlug(ins1, { alias: subjects.math.alias }),
		);

		expect(subject).toMatchObject({
			_id: subjects.math._id,
			name: SUBJECT_MATH.name,
			code: SUBJECT_MATH.code,
			alias: SUBJECT_MATH.alias,
			status: "active",
		});
	});

	test("throws error if subject alias doesn't exist", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.subject.queries.getByAlias,
				withSlug(ins1, { alias: "nonexistent" }),
			),
			ERROR_CODES.SUBJECT.NOT_FOUND,
		);
	});

	test("rejects subject from another institution", async ({
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.subject.queries.getByAlias,
				withSlug(ins1, { alias: subjects.physics.alias }),
			),
			ERROR_CODES.SUBJECT.NOT_FOUND,
		);
	});
});

describe("subjects.list", () => {
	const test = subjectTest();

	test("rejects unauthenticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.query(
				api.subject.queries.list,
				withSlug(ins1, {
					paginationOpts: { numItems: 10, cursor: null },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists subjects for the active institution ordered by name", async ({
		user1,
		ins1,
		asOwner,
		subjects: _subjects,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.subject.queries.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(2);
		expect(result.page).toMatchObject(EXPECTED_SUBJECTS_INS1);
		expect(result.isDone).toBe(true);
	});

	test("lists subjects by name for given query", async ({
		user1,
		ins1,
		asOwner,
		subjects: _subjects,
	}) => {
		const query1 = await asOwner(user1, ins1).query(
			api.subject.queries.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 10, cursor: null },
				query: "mathematics",
			}),
		);

		expect(query1.page).toHaveLength(1);
		expect(query1.page).toMatchObject([
			{
				name: SUBJECT_MATH.name,
				code: SUBJECT_MATH.code,
				alias: SUBJECT_MATH.alias,
				status: "active",
			},
		]);
		expect(query1.isDone).toBe(true);

		const query2 = await asOwner(user1, ins1).query(
			api.subject.queries.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 10, cursor: null },
				query: "some rubbish!",
			}),
		);
		expect(query2.page).toHaveLength(0);
		expect(query2.isDone).toBe(true);
	});

	test("paginates subject results", async ({ t, user1, ins1, asOwner }) => {
		const now = Date.now();

		for (let i = 0; i < 3; i++) {
			await t.run((ctx) =>
				ctx.db.insert("subjects", {
					name: `Subject ${i}`,
					code: `CODE0${i}T`,
					alias: `subject-${i}`,
					color: "#3B82F6",
					institutionId: ins1._id,
					status: "active",
					createdAt: now,
					updatedAt: now,
				}),
			);
		}

		const firstPage = await asOwner(user1, ins1).query(
			api.subject.queries.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 2, cursor: null },
			}),
		);

		expect(firstPage.page).toHaveLength(2);
		expect(firstPage.isDone).toBe(false);

		const secondPage = await asOwner(user1, ins1).query(
			api.subject.queries.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
			}),
		);

		expect(secondPage.page).toHaveLength(1);
		expect(secondPage.isDone).toBe(true);
	});
});

describe("subjects.getById", () => {
	const test = subjectTest();

	test("rejects unauthenticated user", async ({ t, ins1, subjects }) => {
		await expectAppError(
			t.query(
				api.subject.queries.getById,
				withSlug(ins1, { id: subjects.math._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets subject by id", async ({ user1, ins1, subjects, asOwner }) => {
		const subject = await asOwner(user1, ins1).query(
			api.subject.queries.getById,
			withSlug(ins1, { id: subjects.math._id }),
		);

		expect(subject).toMatchObject({
			name: SUBJECT_MATH.name,
			code: SUBJECT_MATH.code,
			alias: SUBJECT_MATH.alias,
			status: "active",
		});
	});

	test("throws error if subject doesn't exist", async ({
		t,
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		const subjectId = await t.run(async (ctx) => {
			await ctx.db.delete("subjects", subjects.math._id);
			return subjects.math._id;
		});

		await expectAppError(
			asOwner(user1, ins1).query(
				api.subject.queries.getById,
				withSlug(ins1, { id: subjectId }),
			),
			ERROR_CODES.SUBJECT.NOT_FOUND,
		);
	});

	test("rejects subject from another institution", async ({
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.subject.queries.getById,
				withSlug(ins1, { id: subjects.physics._id }),
			),
			ERROR_CODES.SUBJECT.NOT_FOUND,
		);
	});
});
