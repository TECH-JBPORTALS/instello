/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import betterAuthSchema from "../betterAuth/schema";
import schema from "../schema";

export const modules = import.meta.glob(["../**/*.ts"]);
export const betterAuthModules = import.meta.glob(["../betterAuth/**/*.ts"]);

/**
 * Test utility wrapper around `convexTest` make the process simple & cleaner.
 * All convex components will be registered here, so no need to register on
 * the test files.
 *
 * @param identity user identity or convex session object
 * @returns TestConvex
 * */
export function createTest() {
	const t = convexTest(schema, modules);
	t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
	return t;
}
