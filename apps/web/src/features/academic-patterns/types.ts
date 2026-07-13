import type { api } from "@instello/convex/api";
import type { FunctionReturnType } from "convex/server";

export type AcademicPatternDto = FunctionReturnType<
	typeof api.academicPattern.queries.list
>[number];

export type AcademicPatternDetailDto = FunctionReturnType<
	typeof api.academicPattern.queries.getById
>;
