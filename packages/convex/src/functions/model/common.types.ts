import type {
	GenericActionCtx,
	GenericMutationCtx,
	GenericQueryCtx,
} from "convex/server";
import type { DataModel } from "../_generated/dataModel";

export type AppMutationCtx = GenericMutationCtx<DataModel>;
export type AppQueryCtx = GenericQueryCtx<DataModel>;
export type AppActionCtx = GenericActionCtx<DataModel>;
