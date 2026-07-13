import { describe, expect } from "vitest";
import { api } from "../../_generated/api";
import { ERROR_CODES } from "../../helpers/constants";
import { expectAppError, ownerOrgTest } from "../../tests/fixtures/index.setup";

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
