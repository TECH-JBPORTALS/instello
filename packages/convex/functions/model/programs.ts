import type { Infer } from "convex/values";
import type { InsMutationCtx, InsQueryCtx } from "~/helpers/customFunctions";
import { vv } from "~/schema";

/**
 * **List all programs inside the current institution**
 *
 * @param ctx `insQuery` ctx
 * @returns programs inside the current institution
 */
export async function list(ctx: InsQueryCtx) {
	return await ctx.db.query("programs").collect();
}

/**
 * **Get program by it's `id` in the current institution**
 *
 * @param ctx `insQuery` ctx
 * @returns program inside the current institution if not null
 */
export async function getById(
	ctx: InsQueryCtx,
	args: Infer<typeof GetByIdSchema>,
) {}

export const GetByIdSchema = vv.object({
	id: vv.string(),
});

/**
 * **Create program in current institution**
 *
 * @param ctx `insMutation` ctx
 * @returns programs inside the current institution
 */
export async function create(
	ctx: InsMutationCtx,
	args: Infer<typeof CreateSchema>,
) {
	return await ctx.db.insert("programs", {
		...args,
		institutionId: ctx.session.activeInstitutionId,
		createdBy: ctx.session.userId,
		status: "active",
	});
}

export const CreateSchema = vv.doc("programs").pick("name", "alias");

/**
 * **Update program's unique alias to new one within the institution**
 *
 * @param ctx `insMutation` ctx
 * @returns updated program with new slug
 */
export async function updateAlias(
	ctx: InsMutationCtx,
	args: Infer<typeof UpdateAliasSchema>,
) {}

export const UpdateAliasSchema = vv.object({
	id: vv.string(),
	newAlias: vv.string(),
});

// NOTE: We dont need to implement DANGER (Destructive) actions now, let's keept it in the last
/**
 * **Remove program in current institution**
 *
 * @param ctx `insMutation` ctx
 * @returns programs inside the current institution
 */
export async function remove(
	ctx: InsMutationCtx,
	args: Infer<typeof RemoveSchema>,
) {}

export const RemoveSchema = vv.object({
	id: vv.string(),
});
