import { describe, expect } from "vitest";
import {
	expectAppError,
	ownerOrgInstitutionTest,
	ownerOrgTest,
	ownerUserIdentity,
} from "#__fixtures__/index.setup";
import { api } from "#_generated/api";
import { ERROR_CODES } from "#helpers/constants";

describe("ownerOrganizations.create", () => {
	const test = ownerOrgTest();

	test("seeds default engineering and diploma patterns", async ({
		ownerOrgs,
		t,
	}) => {
		const patterns = await t.run((ctx) =>
			ctx.db.query("academicPatterns").collect(),
		);

		expect(patterns).toHaveLength(4);

		const user1Patterns = patterns.filter(
			(p) => p.ownerOrganizationId === ownerOrgs.user1Org._id,
		);
		expect(user1Patterns).toHaveLength(2);
		expect(user1Patterns.map((p) => p.templateKey).sort()).toEqual([
			"diploma",
			"engineering",
		]);

		const stages = await t.run((ctx) =>
			ctx.db.query("academicStages").collect(),
		);

		const engineeringPattern = user1Patterns.find(
			(p) => p.templateKey === "engineering",
		);
		const diplomaPattern = user1Patterns.find(
			(p) => p.templateKey === "diploma",
		);

		const engineeringStages = stages.filter(
			(s) => s.academicPatternId === engineeringPattern?._id,
		);
		const diplomaStages = stages.filter(
			(s) => s.academicPatternId === diplomaPattern?._id,
		);

		expect(engineeringStages).toHaveLength(8);
		expect(diplomaStages).toHaveLength(6);
	});
});

describe("academicPatterns.patchMetadata", () => {
	const test = ownerOrgInstitutionTest();

	test("updates name when pattern is locked", async ({
		user1,
		ins1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(
			api.academicPattern.queries.list,
		);
		const pattern = patterns[0];

		await asOwnerUser(user1).mutation(api.academicPattern.mutations.adopt, {
			institutionId: ins1._id,
			academicPatternId: pattern._id,
		});

		await asOwnerUser(user1).mutation(
			api.academicPattern.mutations.patchMetadata,
			{
				id: pattern._id,
				body: { name: "Updated Engineering Pattern" },
			},
		);

		const updated = await asOwnerUser(user1).query(
			api.academicPattern.queries.getById,
			{ id: pattern._id },
		);

		expect(updated.name).toBe("Updated Engineering Pattern");
		expect(updated.canBeEdited).toBe(false);
	});
});

describe("academicPatterns.patchCore", () => {
	const test = ownerOrgInstitutionTest();

	test("rejects core update when pattern is locked", async ({
		user1,
		ins1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(
			api.academicPattern.queries.list,
		);
		const pattern = patterns[0];

		await asOwnerUser(user1).mutation(api.academicPattern.mutations.adopt, {
			institutionId: ins1._id,
			academicPatternId: pattern._id,
		});

		await expectAppError(
			asOwnerUser(user1).mutation(api.academicPattern.mutations.patchCore, {
				id: pattern._id,
				body: { durationInYears: 5 },
			}),
			ERROR_CODES.ACADEMIC_PATTERN.NOT_EDITABLE,
		);
	});

	test("removes stages when duration decreases", async ({
		user1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(
			api.academicPattern.queries.list,
		);
		const diploma = patterns.find(
			(pattern) => pattern.templateKey === "diploma",
		);

		expect(diploma).toBeDefined();

		await asOwnerUser(user1).mutation(api.academicPattern.mutations.patchCore, {
			// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
			id: diploma!._id,
			body: { durationInYears: 2 },
		});

		const detail = await asOwnerUser(user1).query(
			api.academicPattern.queries.getById,
			{
				// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
				id: diploma!._id,
			},
		);

		expect(detail.durationInYears).toBe(2);
		expect(detail.stages).toHaveLength(4);
		expect(detail.stages.at(-1)?.sequenceNumber).toBe(4);
	});

	test("adds stages when duration increases", async ({
		user1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(
			api.academicPattern.queries.list,
		);
		const diploma = patterns.find(
			(pattern) => pattern.templateKey === "diploma",
		);

		expect(diploma).toBeDefined();

		await asOwnerUser(user1).mutation(api.academicPattern.mutations.patchCore, {
			// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
			id: diploma!._id,
			body: { durationInYears: 4 },
		});

		const detail = await asOwnerUser(user1).query(
			api.academicPattern.queries.getById,
			{
				// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
				id: diploma!._id,
			},
		);

		expect(detail.durationInYears).toBe(4);
		expect(detail.stages).toHaveLength(8);
		expect(detail.stages.at(-1)).toMatchObject({
			name: "Semester 8",
			alias: "s8",
			sequenceNumber: 8,
			yearNumber: 4,
		});
	});

	test("preserves custom stage labels when only duration changes", async ({
		user1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(
			api.academicPattern.queries.list,
		);
		const diploma = patterns.find(
			(pattern) => pattern.templateKey === "diploma",
		);

		expect(diploma).toBeDefined();

		const detail = await asOwnerUser(user1).query(
			api.academicPattern.queries.getById,
			{
				// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
				id: diploma!._id,
			},
		);
		const firstStage = detail.stages[0];

		expect(firstStage).toBeDefined();

		await asOwnerUser(user1).mutation(
			api.academicPattern.mutations.patchStageMetadata,
			{
				// biome-ignore lint/style/noNonNullAssertion: first stage is defined above
				id: firstStage!._id,
				body: { name: "Custom Semester", alias: "custom" },
			},
		);

		await asOwnerUser(user1).mutation(api.academicPattern.mutations.patchCore, {
			// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
			id: diploma!._id,
			body: { durationInYears: 4 },
		});

		const updated = await asOwnerUser(user1).query(
			api.academicPattern.queries.getById,
			{
				// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
				id: diploma!._id,
			},
		);

		expect(updated.stages[0]).toMatchObject({
			name: "Custom Semester",
			alias: "custom",
		});
		expect(updated.stages.at(-1)).toMatchObject({
			name: "Semester 8",
			alias: "s8",
		});
	});

	test("rebuilds stages when system type changes", async ({
		user1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(
			api.academicPattern.queries.list,
		);
		const diploma = patterns.find(
			(pattern) => pattern.templateKey === "diploma",
		);

		expect(diploma).toBeDefined();

		await asOwnerUser(user1).mutation(api.academicPattern.mutations.patchCore, {
			// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
			id: diploma!._id,
			body: { systemType: "annual" },
		});

		const detail = await asOwnerUser(user1).query(
			api.academicPattern.queries.getById,
			{
				// biome-ignore lint/style/noNonNullAssertion: diploma is defined above
				id: diploma!._id,
			},
		);

		expect(detail.systemType).toBe("annual");
		expect(detail.stages).toHaveLength(3);
		expect(detail.stages).toEqual([
			expect.objectContaining({
				name: "Year 1",
				alias: "y1",
				sequenceNumber: 1,
				yearNumber: 1,
			}),
			expect.objectContaining({
				name: "Year 2",
				alias: "y2",
				sequenceNumber: 2,
				yearNumber: 2,
			}),
			expect.objectContaining({
				name: "Year 3",
				alias: "y3",
				sequenceNumber: 3,
				yearNumber: 3,
			}),
		]);
	});
});

describe("academicPatterns.adopt", () => {
	const test = ownerOrgInstitutionTest();

	test("locks pattern and creates adoption row", async ({ t, user1, ins1 }) => {
		const client = t.withIdentity(ownerUserIdentity(user1._id));
		const patterns = await client.query(api.academicPattern.queries.list);
		const pattern = patterns[0];

		const adoptionId = await client.mutation(
			api.academicPattern.mutations.adopt,
			{
				institutionId: ins1._id,
				academicPatternId: pattern._id,
			},
		);

		expect(adoptionId).toBeDefined();

		const locked = await client.query(api.academicPattern.queries.getById, {
			id: pattern._id,
		});

		expect(locked.canBeEdited).toBe(false);

		const adoption = await t.run((ctx) =>
			ctx.db
				.query("institutionAcademicPatterns")
				.withIndex("by_institution", (q) => q.eq("institutionId", ins1._id))
				.first(),
		);

		expect(adoption?.academicPatternId).toBe(pattern._id);
	});

	test("rejects when institution already has a pattern", async ({
		t,
		user1,
		ins1,
	}) => {
		const client = t.withIdentity(ownerUserIdentity(user1._id));
		const patterns = await client.query(api.academicPattern.queries.list);

		await client.mutation(api.academicPattern.mutations.adopt, {
			institutionId: ins1._id,
			academicPatternId: patterns[0]?._id,
		});

		await expectAppError(
			client.mutation(api.academicPattern.mutations.adopt, {
				institutionId: ins1._id,
				academicPatternId: patterns[1]?._id,
			}),
			ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.ALREADY_ADOPTED,
		);
	});
});
