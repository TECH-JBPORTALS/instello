import type { Infer } from "convex/values";
import { vv } from "../schema";
import type { AppMutationCtx } from "./common.types";

/**
 * **Create program**
 * @returns programs inside the current institution
 */
export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof CreateSchema>,
) {
	return await ctx.db.insert("programs", {
		...args,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		status: "active",
	});
}

export const CreateSchema = vv
	.doc("programs")
	.pick("name", "alias", "createdBy", "institutionId");
