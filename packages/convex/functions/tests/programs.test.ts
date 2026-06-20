import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "~/_generated/api";
import { ERROR_CODES } from "~/helpers/errors";
import schema from "../schema";
import { modules } from "./test.setup";

describe("programs.list", () => {
	let t: TestConvex<typeof schema>;

	beforeEach(() => {
		t = convexTest(schema, modules);
	});

	// Authentication
	it("rejects to list the programs for unauthenticated user", async () => {
		const r = t
			.withIdentity({}) // without identity
			.query(api.programs.list);

		await expect(r).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("rejects to list the programs if no active insitution in the session", async () => {
		const r = t
			.withIdentity({ subject: "user-1", sessionId: "ses-1" })
			.query(api.programs.list);

		await expect(r).rejects.toThrow(
			ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
		);
	});

	// Expectations based on the authorization
	it("get's all the programs for owner of current institution", () => {
		t.withIdentity({ subject: "user-1" });
	});

	it("get's all the programs for principal of current institution", () => {
		t.withIdentity({ subject: "user-1" });
	});
});
