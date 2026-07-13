import type { api } from "@instello/convex/api";
import type { FunctionReturnType } from "convex/server";

export type ProgramDto = FunctionReturnType<typeof api.program.queries.getById>;

export type ProgramListItemDto = FunctionReturnType<
	typeof api.program.queries.list
>[number];
