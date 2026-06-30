import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import schema from "../../schema";
import {
	primaryIns,
	secondaryIns,
	seedInstitutions,
	seedOwners,
} from "../../tests/test.helpers";
import { createTest } from "../../tests/test.setup";
import { ensureInstitution, ensureSession } from "../auth";
import { ERROR_CODES } from "../errors";
import { modules } from "./test.setup";

describe("ensureSession", () => {
	let t: TestConvex<typeof schema>;

	beforeEach(() => {
		t = convexTest(schema, modules);
	});

	it("rejects when user is not logged in", async () => {
		const promise = t.query((ctx) => ensureSession(ctx));

		await expect(promise).rejects.toThrow(
			ERROR_CODES.BASE.UNAUTHORIZED.message,
		);
	});

	it("returns the `session` if user is authenticated", async () => {
		const promise = t
			.withIdentity({
				subject: "user-1",
				name: "Jhon",
				email: "jhon@gmail.com",
				sessionId: "session-1",
			})
			.query((ctx) => ensureSession(ctx));

		await expect(promise).resolves.toStrictEqual({
			userId: "user-1",
			name: "Jhon",
			email: "jhon@gmail.com",
			id: "session-1",
		});
	});
});

describe("ensureInstitution", () => {
	let t: ReturnType<typeof createTest>;

	beforeEach(() => {
		t = createTest();
	});

	it("rejects when institution slug does not exist", async () => {
		const promise = t.query((ctx) =>
			ensureInstitution(ctx, "unknown-slug", "user-1"),
		);

		await expect(promise).rejects.toThrow(
			ERROR_CODES.BASE.UNAUTHORIZED.message,
		);
	});

	it("rejects when user is not a member of the institution", async () => {
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins2 = secondaryIns(institutions);

		const promise = t.query((ctx) =>
			ensureInstitution(ctx, ins2.slug, user1._id),
		);

		await expect(promise).rejects.toThrow(
			ERROR_CODES.ORGANIZATION.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION.message,
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
