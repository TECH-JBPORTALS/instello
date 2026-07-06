/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academicPatterns from "../academicPatterns.js";
import type * as academicStages from "../academicStages.js";
import type * as auth from "../auth.js";
import type * as classBatches from "../classBatches.js";
import type * as classes from "../classes.js";
import type * as faculty from "../faculty.js";
import type * as helpers_academicPatternTemplates from "../helpers/academicPatternTemplates.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_constants from "../helpers/constants.js";
import type * as helpers_customFunctions from "../helpers/customFunctions.js";
import type * as helpers_phone from "../helpers/phone.js";
import type * as helpers_slug from "../helpers/slug.js";
import type * as helpers_utils from "../helpers/utils.js";
import type * as http from "../http.js";
import type * as institutions from "../institutions.js";
import type * as model_academicPattern from "../model/academicPattern.js";
import type * as model_academicStage from "../model/academicStage.js";
import type * as model_class from "../model/class.js";
import type * as model_classBatch from "../model/classBatch.js";
import type * as model_faculty from "../model/faculty.js";
import type * as model_institution from "../model/institution.js";
import type * as model_institutionAcademicPattern from "../model/institutionAcademicPattern.js";
import type * as model_institutionStudentCategory from "../model/institutionStudentCategory.js";
import type * as model_ownerOrganization from "../model/ownerOrganization.js";
import type * as model_program from "../model/program.js";
import type * as model_programSubject from "../model/programSubject.js";
import type * as model_student from "../model/student.js";
import type * as model_subject from "../model/subject.js";
import type * as model_timetable from "../model/timetable.js";
import type * as ownerOrganizations from "../ownerOrganizations.js";
import type * as programSubjects from "../programSubjects.js";
import type * as programs from "../programs.js";
import type * as seed_academicPatternTemplates from "../seed/academicPatternTemplates.js";
import type * as seed_institutions from "../seed/institutions.js";
import type * as seed_mock from "../seed/mock.js";
import type * as seed_timetables from "../seed/timetables.js";
import type * as seed_users from "../seed/users.js";
import type * as students from "../students.js";
import type * as subjects from "../subjects.js";
import type * as timetables from "../timetables.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academicPatterns: typeof academicPatterns;
  academicStages: typeof academicStages;
  auth: typeof auth;
  classBatches: typeof classBatches;
  classes: typeof classes;
  faculty: typeof faculty;
  "helpers/academicPatternTemplates": typeof helpers_academicPatternTemplates;
  "helpers/auth": typeof helpers_auth;
  "helpers/constants": typeof helpers_constants;
  "helpers/customFunctions": typeof helpers_customFunctions;
  "helpers/phone": typeof helpers_phone;
  "helpers/slug": typeof helpers_slug;
  "helpers/utils": typeof helpers_utils;
  http: typeof http;
  institutions: typeof institutions;
  "model/academicPattern": typeof model_academicPattern;
  "model/academicStage": typeof model_academicStage;
  "model/class": typeof model_class;
  "model/classBatch": typeof model_classBatch;
  "model/faculty": typeof model_faculty;
  "model/institution": typeof model_institution;
  "model/institutionAcademicPattern": typeof model_institutionAcademicPattern;
  "model/institutionStudentCategory": typeof model_institutionStudentCategory;
  "model/ownerOrganization": typeof model_ownerOrganization;
  "model/program": typeof model_program;
  "model/programSubject": typeof model_programSubject;
  "model/student": typeof model_student;
  "model/subject": typeof model_subject;
  "model/timetable": typeof model_timetable;
  ownerOrganizations: typeof ownerOrganizations;
  programSubjects: typeof programSubjects;
  programs: typeof programs;
  "seed/academicPatternTemplates": typeof seed_academicPatternTemplates;
  "seed/institutions": typeof seed_institutions;
  "seed/mock": typeof seed_mock;
  "seed/timetables": typeof seed_timetables;
  "seed/users": typeof seed_users;
  students: typeof students;
  subjects: typeof subjects;
  timetables: typeof timetables;
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
