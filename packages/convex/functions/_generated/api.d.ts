/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_customFunctions from "../helpers/customFunctions.js";
import type * as helpers_errors from "../helpers/errors.js";
import type * as http from "../http.js";
import type * as model_programs from "../model/programs.js";
import type * as programs from "../programs.js";
import type * as seed_users from "../seed/users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "helpers/auth": typeof helpers_auth;
  "helpers/customFunctions": typeof helpers_customFunctions;
  "helpers/errors": typeof helpers_errors;
  http: typeof http;
  "model/programs": typeof model_programs;
  programs: typeof programs;
  "seed/users": typeof seed_users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
