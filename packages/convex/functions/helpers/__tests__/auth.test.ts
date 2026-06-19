import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import schema from "../../schema";
import { requireSession } from "../auth";
import { ERROR_CODES } from "../errors";
import { modules } from "./test.setup";

describe("requireSession", () => {
	let t: TestConvex<typeof schema>;

	beforeEach(() => {
		t = convexTest(schema, modules);
	});

	it("rejects the unauthenticated user from access resources", async () => {
		await expect(t.query((ctx) => requireSession(ctx))).rejects.toThrow(
			ERROR_CODES.UNAUTHORIZED.message,
		);
	});

	it("returns the user id if user is authenticated", async () => {
		await expect(
			t.withIdentity({ subject: "user-1" }).query((ctx) => requireSession(ctx)),
		).resolves.toBe("user-1");
	});
});
