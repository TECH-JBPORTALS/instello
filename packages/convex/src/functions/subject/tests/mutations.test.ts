import { describe, expect } from "vitest";
import { api } from "../../_generated/api";
import { ERROR_CODES } from "../../helpers/constants";
import {
	createSubjectInput,
	expectAppError,
	institutionTest,
	SUBJECT_MATH,
	subjectTest,
	withSlug,
} from "../../tests/fixtures/index.setup";

describe("subjects.create", () => {
	const test = institutionTest();

	test("rejects unauthenticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.mutation(
				api.subject.mutations.create,
				withSlug(ins1, createSubjectInput()),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("creates subject for active institution", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const subjectId = await asOwner(user1, ins1).mutation(
			api.subject.mutations.create,
			withSlug(ins1, createSubjectInput()),
		);

		expect(subjectId).toBeDefined();

		const insertedSubjects = await t.run((ctx) =>
			ctx.db.query("subjects").collect(),
		);

		expect(insertedSubjects).toMatchObject([
			{
				name: SUBJECT_MATH.name,
				code: SUBJECT_MATH.code,
				alias: SUBJECT_MATH.alias,
			},
		]);
	});

	test("rejects duplicate alias within the same institution", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.create,
			withSlug(ins1, createSubjectInput()),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.subject.mutations.create,
				withSlug(
					ins1,
					createSubjectInput({
						name: "Advanced Mathematics",
						code: "14MAT02T",
					}),
				),
			),
			ERROR_CODES.SUBJECT.ALIAS_ALREADY_EXISTS,
		);

		const insertedSubjects = await t.run((ctx) =>
			ctx.db.query("subjects").collect(),
		);

		expect(insertedSubjects).toHaveLength(1);
	});

	test("rejects duplicate code within the same institution", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.create,
			withSlug(ins1, createSubjectInput()),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.subject.mutations.create,
				withSlug(
					ins1,
					createSubjectInput({
						name: "Another Mathematics",
						alias: "another-mathematics",
					}),
				),
			),
			ERROR_CODES.SUBJECT.CODE_ALREADY_EXISTS,
		);
	});
});

describe("subjects.updateName", () => {
	const test = subjectTest();

	test("rejects unauthenticated user", async ({ t, ins1, subjects }) => {
		await expectAppError(
			t.mutation(
				api.subject.mutations.updateName,
				withSlug(ins1, {
					id: subjects.math._id,
					body: { name: "Advanced Mathematics" },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("updates subject name", async ({
		t,
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.updateName,
			withSlug(ins1, {
				id: subjects.math._id,
				body: { name: "Advanced Mathematics" },
			}),
		);

		const patchedSubject = await t.run((ctx) =>
			ctx.db.get("subjects", subjects.math._id),
		);

		expect(patchedSubject).toMatchObject({
			name: "Advanced Mathematics",
			code: subjects.math.code,
			alias: subjects.math.alias,
			status: subjects.math.status,
		});
	});

	test("throws error if trying to update name for non existing subject", async ({
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
			asOwner(user1, ins1).mutation(
				api.subject.mutations.updateName,
				withSlug(ins1, {
					id: subjectId,
					body: { name: "Advanced Mathematics" },
				}),
			),
			ERROR_CODES.SUBJECT.NOT_FOUND,
		);
	});
});

describe("subjects.updateCode", () => {
	const test = subjectTest();

	test("updates subject code", async ({
		t,
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.updateCode,
			withSlug(ins1, {
				id: subjects.math._id,
				body: { code: "14MAT99T" },
			}),
		);

		const patchedSubject = await t.run((ctx) =>
			ctx.db.get("subjects", subjects.math._id),
		);

		expect(patchedSubject).toMatchObject({
			name: subjects.math.name,
			code: "14MAT99T",
			alias: subjects.math.alias,
		});
	});

	test("rejects duplicate code on update", async ({
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.subject.mutations.updateCode,
				withSlug(ins1, {
					id: subjects.math._id,
					body: { code: subjects.appliedScience.code },
				}),
			),
			ERROR_CODES.SUBJECT.CODE_ALREADY_EXISTS,
		);
	});
});

describe("subjects.updateAlias", () => {
	const test = subjectTest();

	test("updates subject alias", async ({
		t,
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.updateAlias,
			withSlug(ins1, {
				id: subjects.math._id,
				body: { alias: "math" },
			}),
		);

		const patchedSubject = await t.run((ctx) =>
			ctx.db.get("subjects", subjects.math._id),
		);

		expect(patchedSubject).toMatchObject({
			name: subjects.math.name,
			code: subjects.math.code,
			alias: "math",
		});
	});

	test("rejects duplicate alias on update", async ({
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.subject.mutations.updateAlias,
				withSlug(ins1, {
					id: subjects.math._id,
					body: { alias: subjects.appliedScience.alias },
				}),
			),
			ERROR_CODES.SUBJECT.ALIAS_ALREADY_EXISTS,
		);
	});
});

describe("subjects.updateColor", () => {
	const test = subjectTest();

	test("updates subject color", async ({
		t,
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.updateColor,
			withSlug(ins1, {
				id: subjects.math._id,
				body: { color: "#EF4444" },
			}),
		);

		const patchedSubject = await t.run((ctx) =>
			ctx.db.get("subjects", subjects.math._id),
		);

		expect(patchedSubject).toMatchObject({
			color: "#EF4444",
		});
	});
});

describe("subjects.updateDescription", () => {
	const test = subjectTest();

	test("updates subject description", async ({
		t,
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.updateDescription,
			withSlug(ins1, {
				id: subjects.math._id,
				body: { description: "Core mathematics course" },
			}),
		);

		const patchedSubject = await t.run((ctx) =>
			ctx.db.get("subjects", subjects.math._id),
		);

		expect(patchedSubject).toMatchObject({
			description: "Core mathematics course",
		});
	});

	test("clears subject description", async ({
		t,
		user1,
		ins1,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.subject.mutations.updateDescription,
			withSlug(ins1, {
				id: subjects.math._id,
				body: { description: "Temporary description" },
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.subject.mutations.updateDescription,
			withSlug(ins1, {
				id: subjects.math._id,
				body: { description: "" },
			}),
		);

		const patchedSubject = await t.run((ctx) =>
			ctx.db.get("subjects", subjects.math._id),
		);

		expect(patchedSubject?.description).toBeUndefined();
	});
});
