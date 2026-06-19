import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import schema from "../../schema";
import { requireInstitution, requireSession } from "../auth";
import { ERROR_CODES } from "../errors";
import { modules } from "./test.setup";

describe("requireSession", () => {
	let t: TestConvex<typeof schema>;

	beforeEach(() => {
		t = convexTest(schema, modules);
	});

	it("rejects when user is not logged in", async () => {
		const promise = t.query((ctx) => requireSession(ctx));

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
			.query((ctx) => requireSession(ctx));

		await expect(promise).resolves.toStrictEqual({
			userId: "user-1",
			name: "Jhon",
			email: "jhon@gmail.com",
			id: "session-1",
		});
	});
});

describe("requireInstitution", () => {
	let t: TestConvex<typeof schema>;

	beforeEach(() => {
		t = convexTest(schema, modules);
	});

	it("rejects when user is not logged in", async () => {
		const promise = t.query((ctx) => requireInstitution(ctx));

		await expect(promise).rejects.toThrow(
			ERROR_CODES.BASE.UNAUTHORIZED.message,
		);
	});

	it("rejects when active institution is not set in the session", async () => {
		const promise = t
			.withIdentity({ subject: "user-1" })
			.query((ctx) => requireInstitution(ctx));

		await expect(promise).rejects.toThrow(
			ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
		);
	});

	it("returns the `activeInstitutionId` if it's set in the session", async () => {
		const promise = t
			.withIdentity({ subject: "user-1", activeInstitutionId: "ins-1" })
			.query((ctx) => requireInstitution(ctx));

		await expect(promise).resolves.toBe("ins-1");
	});
});
