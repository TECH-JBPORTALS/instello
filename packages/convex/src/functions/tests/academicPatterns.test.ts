import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	expectAppError,
	ownerOrgInstitutionTest,
	ownerOrgTest,
	ownerUserIdentity,
} from "./fixtures/index.setup";

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

describe("academicPatterns.list", () => {
	const test = ownerOrgTest();

	test("rejects unauthenticated user", async ({ t }) => {
		await expectAppError(
			t.query(api.academicPatterns.list),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists patterns for authenticated owner", async ({
		user1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(api.academicPatterns.list);

		expect(patterns).toHaveLength(2);
		expect(patterns[0]?.stageCount).toBeGreaterThan(0);
		expect(patterns.every((p) => p.canBeEdited)).toBe(true);
	});
});

describe("academicPatterns.getById", () => {
	const test = ownerOrgTest();

	test("returns pattern with ordered stages", async ({
		user1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(api.academicPatterns.list);
		const engineering = patterns.find((p) => p.templateKey === "engineering");

		expect(engineering).toBeDefined();

		const detail = await asOwnerUser(user1).query(
			api.academicPatterns.getById,
			// biome-ignore lint/style/noNonNullAssertion: <No need to assert here>
			{ id: engineering!._id },
		);

		expect(detail.stages).toHaveLength(8);
		expect(detail.stages[0]?.sequenceNumber).toBe(1);
		expect(detail.stages[7]?.sequenceNumber).toBe(8);
	});

	test("rejects access to another owner org pattern", async ({
		user1,
		user2,
		asOwnerUser,
	}) => {
		const user2Patterns = await asOwnerUser(user2).query(
			api.academicPatterns.list,
		);

		await expectAppError(
			asOwnerUser(user1).query(api.academicPatterns.getById, {
				id: user2Patterns[0]?._id,
			}),
			ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND,
		);
	});
});

describe("academicPatterns.patchMetadata", () => {
	const test = ownerOrgInstitutionTest();

	test("updates name when pattern is locked", async ({
		user1,
		ins1,
		asOwnerUser,
	}) => {
		const patterns = await asOwnerUser(user1).query(api.academicPatterns.list);
		const pattern = patterns[0];

		await asOwnerUser(user1).mutation(api.academicPatterns.adopt, {
			institutionId: ins1._id,
			academicPatternId: pattern._id,
		});

		await asOwnerUser(user1).mutation(api.academicPatterns.patchMetadata, {
			id: pattern._id,
			body: { name: "Updated Engineering Pattern" },
		});

		const updated = await asOwnerUser(user1).query(
			api.academicPatterns.getById,
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
		const patterns = await asOwnerUser(user1).query(api.academicPatterns.list);
		const pattern = patterns[0];

		await asOwnerUser(user1).mutation(api.academicPatterns.adopt, {
			institutionId: ins1._id,
			academicPatternId: pattern._id,
		});

		await expectAppError(
			asOwnerUser(user1).mutation(api.academicPatterns.patchCore, {
				id: pattern._id,
				body: { durationInYears: 5 },
			}),
			ERROR_CODES.ACADEMIC_PATTERN.NOT_EDITABLE,
		);
	});
});

describe("academicPatterns.adopt", () => {
	const test = ownerOrgInstitutionTest();

	test("locks pattern and creates adoption row", async ({ t, user1, ins1 }) => {
		const client = t.withIdentity(ownerUserIdentity(user1._id));
		const patterns = await client.query(api.academicPatterns.list);
		const pattern = patterns[0];

		const adoptionId = await client.mutation(api.academicPatterns.adopt, {
			institutionId: ins1._id,
			academicPatternId: pattern._id,
		});

		expect(adoptionId).toBeDefined();

		const locked = await client.query(api.academicPatterns.getById, {
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
		const patterns = await client.query(api.academicPatterns.list);

		await client.mutation(api.academicPatterns.adopt, {
			institutionId: ins1._id,
			academicPatternId: patterns[0]?._id,
		});

		await expectAppError(
			client.mutation(api.academicPatterns.adopt, {
				institutionId: ins1._id,
				academicPatternId: patterns[1]?._id,
			}),
			ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.ALREADY_ADOPTED,
		);
	});
});

describe("academicPatterns.release", () => {
	const test = ownerOrgInstitutionTest();

	test("unlocks pattern when last adoption is removed", async ({
		t,
		user1,
		ins1,
	}) => {
		const client = t.withIdentity(ownerUserIdentity(user1._id));
		const patterns = await client.query(api.academicPatterns.list);
		const pattern = patterns[0];

		await client.mutation(api.academicPatterns.adopt, {
			institutionId: ins1._id,
			academicPatternId: pattern._id,
		});

		await client.mutation(api.academicPatterns.release, {
			institutionId: ins1._id,
		});

		const unlocked = await client.query(api.academicPatterns.getById, {
			id: pattern._id,
		});

		expect(unlocked.canBeEdited).toBe(true);
	});
});
