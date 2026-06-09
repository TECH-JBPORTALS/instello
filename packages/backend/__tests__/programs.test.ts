import { convexTest } from "convex-test";
import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import { modules } from "./test.setup";

describe("Programs", () => {
	let t: ReturnType<typeof convexTest>;

	beforeAll(() => {
		t = convexTest(schema, modules);
	});

	it("List programs should be empty", async () => {
		const programs = await t.query(api.programs.list);
		expect(programs.length).toBe(0);
	});
});
