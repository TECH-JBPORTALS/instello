import { convexTest } from "convex-test";
import { test as vitestTest } from "vitest";
import betterAuthSchema from "../../../betterAuth/schema";
import schema from "../../../schema";
import { betterAuthModules, modules } from "../../../test.config";

const base = vitestTest.extend("t", async () => {
	const t = convexTest(schema, modules);
	t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
	return t;
});

export function baseTest() {
	return base;
}
