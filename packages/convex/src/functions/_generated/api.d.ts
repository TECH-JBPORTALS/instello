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
import type * as classes from "../classes.js";
import type * as faculty from "../faculty.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_constants from "../helpers/constants.js";
import type * as helpers_customFunctions from "../helpers/customFunctions.js";
import type * as helpers_utils from "../helpers/utils.js";
import type * as http from "../http.js";
import type * as institutions from "../institutions.js";
import type * as model_class from "../model/class.js";
import type * as model_faculty from "../model/faculty.js";
import type * as model_institution from "../model/institution.js";
import type * as model_ownerOrganization from "../model/ownerOrganization.js";
import type * as model_program from "../model/program.js";
import type * as ownerOrganizations from "../ownerOrganizations.js";
import type * as programs from "../programs.js";
import type * as seed_institutions from "../seed/institutions.js";
import type * as seed_users from "../seed/users.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  classes: typeof classes;
  faculty: typeof faculty;
  "helpers/auth": typeof helpers_auth;
  "helpers/constants": typeof helpers_constants;
  "helpers/customFunctions": typeof helpers_customFunctions;
  "helpers/utils": typeof helpers_utils;
  http: typeof http;
  institutions: typeof institutions;
  "model/class": typeof model_class;
  "model/faculty": typeof model_faculty;
  "model/institution": typeof model_institution;
  "model/ownerOrganization": typeof model_ownerOrganization;
  "model/program": typeof model_program;
  ownerOrganizations: typeof ownerOrganizations;
  programs: typeof programs;
  "seed/institutions": typeof seed_institutions;
  "seed/users": typeof seed_users;
  users: typeof users;
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
