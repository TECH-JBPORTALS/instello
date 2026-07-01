import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	baseTest,
	expectAppError,
	expectedInstitutionsForUser,
	institutionTest,
	ownerTest,
	seedSingleInstitution,
} from "./fixtures/index.setup";

describe("institutions.listMyOwned", () => {
	const test = institutionTest();

	test("rejects unthencticated user", async ({ t }) => {
		await expectAppError(
			t.query(api.institutions.listMyOwned),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists all institutions owned by current user", async ({
		t,
		user1,
		institutions,
	}) => {
		const expectedUser1Institutions = expectedInstitutionsForUser(
			institutions,
			user1._id,
		);

		const myInstitutions = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.institutions.listMyOwned);

		expect(myInstitutions).toHaveLength(expectedUser1Institutions.length);
		expect(myInstitutions).toEqual(expectedUser1Institutions);
	});

	test("doesn't lists another person's institutions", async ({
		t,
		user2,
		institutions,
	}) => {
		const expectedUser2Institutions = expectedInstitutionsForUser(
			institutions,
			user2._id,
		);

		const myInstitutions = await t
			.withIdentity({
				subject: user2._id,
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.institutions.listMyOwned);

		expect(myInstitutions).toHaveLength(expectedUser2Institutions.length);
		expect(myInstitutions).toEqual(expectedUser2Institutions);
	});
});

describe("institutions.checkCode", () => {
	describe("when unauthenticated", () => {
		const test = baseTest();

		test("rejects unauthenticated user", async ({ t }) => {
			await expectAppError(
				t.query(api.institutions.checkCode, { code: "364" }),
				ERROR_CODES.BASE.UNAUTHORIZED,
			);
		});
	});

	describe("when authenticated", () => {
		const test = ownerTest();

		test("returns available when code is not taken", async ({ t, user1 }) => {
			const result = await t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: "ins-1",
					sessionId: "ses-1",
				})
				.query(api.institutions.checkCode, { code: "unique-code-123" });

			expect(result).toEqual({ available: true });
		});

		test("returns unavailable when code already exists", async ({
			t,
			user1,
		}) => {
			const code = "364";

			await t.run(async (ctx) => {
				await seedSingleInstitution(ctx, { code });
			});

			const result = await t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: "ins-1",
					sessionId: "ses-1",
				})
				.query(api.institutions.checkCode, { code });

			expect(result).toEqual({ available: false });
		});
	});
});
