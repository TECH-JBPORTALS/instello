import { beforeEach, describe, expect, it } from "vitest";
import {
	expectAppError,
	primaryIns,
	secondaryIns,
	seedInstitutions,
	seedOwners,
} from "../../tests/test.helpers";
import { createTest } from "../../tests/test.setup";
import { ensureInstitution, ensureSession } from "../auth";
import { ERROR_CODES } from "../constants";

describe("ensureSession", () => {
	let t: ReturnType<typeof createTest>;

	beforeEach(() => {
		t = createTest();
	});

	it("required authentication", async () => {
		const promise = t.query((ctx) => ensureSession(ctx));

		await expectAppError(promise, ERROR_CODES.BASE.UNAUTHORIZED);
	});

	it("returns the `session` for a valid authenticated user", async () => {
		const { user1 } = await t.run(seedOwners);

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
	let t: ReturnType<typeof createTest>;

	beforeEach(() => {
		t = createTest();
	});

	it("required institution identity", async () => {
		const promise = t.query((ctx) =>
			ensureInstitution(ctx, "unknown-slug", "unknown-user-id"),
		);

		await expectAppError(
			promise,
			ERROR_CODES.ORGANIZATION.ORGANIZATION_NOT_FOUND,
		);
	});

	it("requires user to be part of instiuttion", async () => {
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins2 = secondaryIns(institutions);

		const promise = t.query((ctx) =>
			ensureInstitution(ctx, ins2.slug, user1._id),
		);

		await expectAppError(
			promise,
			ERROR_CODES.ORGANIZATION.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION,
		);
	});

	it("returns institution and membership for a valid slug and member", async () => {
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);

		const result = await t.query((ctx) =>
			ensureInstitution(ctx, ins1.slug, user1._id),
		);

		expect(result.institution._id).toBe(ins1._id);
		expect(result.membership.role).toBe("owner");
	});
});
