import { convexTest } from "convex-test";
import { test as vitestTest } from "vitest";
import betterAuthSchema from "../../../betterAuth/schema";
import schema from "../../../schema";

export const modules = import.meta.glob(["../../../**/*.ts"]);
export const betterAuthModules = import.meta.glob([
	"../../../betterAuth/**/*.ts",
]);

const base = vitestTest.extend("t", async () => {
	const t = convexTest(schema, modules);
	t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
	return t;
});

export function baseTest() {
	return base;
}
