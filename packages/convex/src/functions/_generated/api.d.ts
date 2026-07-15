/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academicPattern_model_academicPattern from "../academicPattern/model/academicPattern.js";
import type * as academicPattern_model_academicStage from "../academicPattern/model/academicStage.js";
import type * as academicPattern_mutations from "../academicPattern/mutations.js";
import type * as academicPattern_queries from "../academicPattern/queries.js";
import type * as academicPattern_validator_academicPattern from "../academicPattern/validator/academicPattern.js";
import type * as academicPattern_validator_academicStage from "../academicPattern/validator/academicStage.js";
import type * as attendance_helpers from "../attendance/helpers.js";
import type * as attendance_model_activityLog from "../attendance/model/activityLog.js";
import type * as attendance_model_record from "../attendance/model/record.js";
import type * as attendance_model_register from "../attendance/model/register.js";
import type * as attendance_model_session from "../attendance/model/session.js";
import type * as attendance_mutations from "../attendance/mutations.js";
import type * as attendance_queries from "../attendance/queries.js";
import type * as attendance_service_register from "../attendance/service/register.js";
import type * as attendance_validator_activity from "../attendance/validator/activity.js";
import type * as attendance_validator_record from "../attendance/validator/record.js";
import type * as attendance_validator_register from "../attendance/validator/register.js";
import type * as attendance_validator_session from "../attendance/validator/session.js";
import type * as auth from "../auth.js";
import type * as class_model_class from "../class/model/class.js";
import type * as class_model_classBatch from "../class/model/classBatch.js";
import type * as class_mutations from "../class/mutations.js";
import type * as class_queries from "../class/queries.js";
import type * as class_validator_class from "../class/validator/class.js";
import type * as class_validator_classBatch from "../class/validator/classBatch.js";
import type * as emails from "../emails.js";
import type * as faculty_migrations from "../faculty/migrations.js";
import type * as faculty_model_faculty from "../faculty/model/faculty.js";
import type * as faculty_mutations from "../faculty/mutations.js";
import type * as faculty_queries from "../faculty/queries.js";
import type * as faculty_service_faculty from "../faculty/service/faculty.js";
import type * as faculty_validator_faculty from "../faculty/validator/faculty.js";
import type * as helpers_academicPatternTemplates from "../helpers/academicPatternTemplates.js";
import type * as helpers_academicSchedule from "../helpers/academicSchedule.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_constants from "../helpers/constants.js";
import type * as helpers_customFunctions from "../helpers/customFunctions.js";
import type * as helpers_phone from "../helpers/phone.js";
import type * as helpers_slug from "../helpers/slug.js";
import type * as helpers_timetableSchedule from "../helpers/timetableSchedule.js";
import type * as helpers_utils from "../helpers/utils.js";
import type * as http from "../http.js";
import type * as institution_model_institution from "../institution/model/institution.js";
import type * as institution_model_institutionAcademicPattern from "../institution/model/institutionAcademicPattern.js";
import type * as institution_model_studentCategory from "../institution/model/studentCategory.js";
import type * as institution_mutations from "../institution/mutations.js";
import type * as institution_queries from "../institution/queries.js";
import type * as institution_validator_institution from "../institution/validator/institution.js";
import type * as institution_validator_institutionAcademicPattern from "../institution/validator/institutionAcademicPattern.js";
import type * as institution_validator_studentCategory from "../institution/validator/studentCategory.js";
import type * as model_ownerOrganization from "../model/ownerOrganization.js";
import type * as ownerOrganizations from "../ownerOrganizations.js";
import type * as program_model_program from "../program/model/program.js";
import type * as program_model_programSubject from "../program/model/programSubject.js";
import type * as program_mutations from "../program/mutations.js";
import type * as program_queries from "../program/queries.js";
import type * as program_validator_program from "../program/validator/program.js";
import type * as program_validator_programSubject from "../program/validator/programSubject.js";
import type * as seed_academicPatternTemplates from "../seed/academicPatternTemplates.js";
import type * as seed_institutions from "../seed/institutions.js";
import type * as seed_mock from "../seed/mock.js";
import type * as seed_timetables from "../seed/timetables.js";
import type * as seed_users from "../seed/users.js";
import type * as student_model_student from "../student/model/student.js";
import type * as student_mutations from "../student/mutations.js";
import type * as student_queries from "../student/queries.js";
import type * as student_validator_student from "../student/validator/student.js";
import type * as subject_model_subject from "../subject/model/subject.js";
import type * as subject_mutations from "../subject/mutations.js";
import type * as subject_queries from "../subject/queries.js";
import type * as subject_validator_subject from "../subject/validator/subject.js";
import type * as timetable_model_timetable from "../timetable/model/timetable.js";
import type * as timetable_model_timetableSlot from "../timetable/model/timetableSlot.js";
import type * as timetable_mutations from "../timetable/mutations.js";
import type * as timetable_queries from "../timetable/queries.js";
import type * as timetable_service_timetable from "../timetable/service/timetable.js";
import type * as timetable_validator_timetable from "../timetable/validator/timetable.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "academicPattern/model/academicPattern": typeof academicPattern_model_academicPattern;
  "academicPattern/model/academicStage": typeof academicPattern_model_academicStage;
  "academicPattern/mutations": typeof academicPattern_mutations;
  "academicPattern/queries": typeof academicPattern_queries;
  "academicPattern/validator/academicPattern": typeof academicPattern_validator_academicPattern;
  "academicPattern/validator/academicStage": typeof academicPattern_validator_academicStage;
  "attendance/helpers": typeof attendance_helpers;
  "attendance/model/activityLog": typeof attendance_model_activityLog;
  "attendance/model/record": typeof attendance_model_record;
  "attendance/model/register": typeof attendance_model_register;
  "attendance/model/session": typeof attendance_model_session;
  "attendance/mutations": typeof attendance_mutations;
  "attendance/queries": typeof attendance_queries;
  "attendance/service/register": typeof attendance_service_register;
  "attendance/validator/activity": typeof attendance_validator_activity;
  "attendance/validator/record": typeof attendance_validator_record;
  "attendance/validator/register": typeof attendance_validator_register;
  "attendance/validator/session": typeof attendance_validator_session;
  auth: typeof auth;
  "class/model/class": typeof class_model_class;
  "class/model/classBatch": typeof class_model_classBatch;
  "class/mutations": typeof class_mutations;
  "class/queries": typeof class_queries;
  "class/validator/class": typeof class_validator_class;
  "class/validator/classBatch": typeof class_validator_classBatch;
  emails: typeof emails;
  "faculty/migrations": typeof faculty_migrations;
  "faculty/model/faculty": typeof faculty_model_faculty;
  "faculty/mutations": typeof faculty_mutations;
  "faculty/queries": typeof faculty_queries;
  "faculty/service/faculty": typeof faculty_service_faculty;
  "faculty/validator/faculty": typeof faculty_validator_faculty;
  "helpers/academicPatternTemplates": typeof helpers_academicPatternTemplates;
  "helpers/academicSchedule": typeof helpers_academicSchedule;
  "helpers/auth": typeof helpers_auth;
  "helpers/constants": typeof helpers_constants;
  "helpers/customFunctions": typeof helpers_customFunctions;
  "helpers/phone": typeof helpers_phone;
  "helpers/slug": typeof helpers_slug;
  "helpers/timetableSchedule": typeof helpers_timetableSchedule;
  "helpers/utils": typeof helpers_utils;
  http: typeof http;
  "institution/model/institution": typeof institution_model_institution;
  "institution/model/institutionAcademicPattern": typeof institution_model_institutionAcademicPattern;
  "institution/model/studentCategory": typeof institution_model_studentCategory;
  "institution/mutations": typeof institution_mutations;
  "institution/queries": typeof institution_queries;
  "institution/validator/institution": typeof institution_validator_institution;
  "institution/validator/institutionAcademicPattern": typeof institution_validator_institutionAcademicPattern;
  "institution/validator/studentCategory": typeof institution_validator_studentCategory;
  "model/ownerOrganization": typeof model_ownerOrganization;
  ownerOrganizations: typeof ownerOrganizations;
  "program/model/program": typeof program_model_program;
  "program/model/programSubject": typeof program_model_programSubject;
  "program/mutations": typeof program_mutations;
  "program/queries": typeof program_queries;
  "program/validator/program": typeof program_validator_program;
  "program/validator/programSubject": typeof program_validator_programSubject;
  "seed/academicPatternTemplates": typeof seed_academicPatternTemplates;
  "seed/institutions": typeof seed_institutions;
  "seed/mock": typeof seed_mock;
  "seed/timetables": typeof seed_timetables;
  "seed/users": typeof seed_users;
  "student/model/student": typeof student_model_student;
  "student/mutations": typeof student_mutations;
  "student/queries": typeof student_queries;
  "student/validator/student": typeof student_validator_student;
  "subject/model/subject": typeof subject_model_subject;
  "subject/mutations": typeof subject_mutations;
  "subject/queries": typeof subject_queries;
  "subject/validator/subject": typeof subject_validator_subject;
  "timetable/model/timetable": typeof timetable_model_timetable;
  "timetable/model/timetableSlot": typeof timetable_model_timetableSlot;
  "timetable/mutations": typeof timetable_mutations;
  "timetable/queries": typeof timetable_queries;
  "timetable/service/timetable": typeof timetable_service_timetable;
  "timetable/validator/timetable": typeof timetable_validator_timetable;
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
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
