import { describe, expect } from "vitest";
import {
	baseTest,
	expectAppError,
	institutionTest,
	ownerTest,
} from "../../tests/fixtures";
import { ensureInstitution, ensureSession } from "../auth";
import { ERROR_CODES } from "../constants";

describe("ensureSession", () => {
	const test = baseTest();

	test("required authentication", async ({ t }) => {
		const promise = t.query((ctx) => ensureSession(ctx));

		await expectAppError(promise, ERROR_CODES.BASE.UNAUTHORIZED);
	});
});

describe("ensureSession with owners", () => {
	const test = ownerTest();

	test("returns the `session` for a valid authenticated user", async ({
		t,
		user1,
	}) => {
		const result = await t
			.withIdentity({
				subject: user1._id,
				sessionId: "session-1",
			})
			.query((ctx) => ensureSession(ctx));

		expect(result).toMatchObject({
			userId: user1._id,
			id: "session-1",
			user: {
				_id: user1._id,
				name: user1.name,
				email: user1.email,
			},
		});
	});
});

describe("ensureInstitution", () => {
	const test = baseTest();

	test("required institution identity", async ({ t }) => {
		const promise = t.query((ctx) =>
			ensureInstitution(ctx, "unknown-slug", "unknown-user-id"),
		);

		await expectAppError(
			promise,
			ERROR_CODES.ORGANIZATION.ORGANIZATION_NOT_FOUND,
		);
	});
});

describe("ensureInstitution with institutions", () => {
	const test = institutionTest();

	test("requires user to be part of instiuttion", async ({
		t,
		user1,
		ins2,
	}) => {
		const promise = t.query((ctx) =>
			ensureInstitution(ctx, ins2.slug, user1._id),
		);

		await expectAppError(
			promise,
			ERROR_CODES.ORGANIZATION.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION,
		);
	});

	test("returns institution and membership for a valid slug and member", async ({
		t,
		user1,
		ins1,
	}) => {
		const result = await t.query((ctx) =>
			ensureInstitution(ctx, ins1.slug, user1._id),
		);

		expect(result.institution._id).toBe(ins1._id);
		expect(result.membership.role).toBe("owner");
	});
});
