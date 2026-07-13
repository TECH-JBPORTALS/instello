import type { api } from "@instello/convex/api";
import type { FunctionReturnType } from "convex/server";

export type InstitutionDto = FunctionReturnType<
	typeof api.institution.queries.getCurrent
>;

export type InstitutionListItemDto = FunctionReturnType<
	typeof api.institution.queries.listMyOwned
>[number];
