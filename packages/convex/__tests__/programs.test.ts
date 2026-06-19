import { convexTest } from "convex-test";
import { beforeAll, describe, it } from "vitest";
import schema from "../functions/schema";
import { modules } from "./test.setup";

describe("Programs", () => {
	let t: ReturnType<typeof convexTest>;

	beforeAll(() => {
		t = convexTest(schema, modules);
	});

	it("does nothing...", () => {
		t.withIdentity({ subject: "user-1" });
	});
});
