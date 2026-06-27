import { components } from "../_generated/api";
import type { AppQueryCtx } from "./common.types";

/**
 * **List all institutions by user and role**
 * @param ctx AppCtx
 * @param args userId and role
 */
export async function listByUserRole(
	ctx: AppQueryCtx,
	args: { userId: string; role: "owner" | "faculty" | "principal" },
) {
	const institutions = await ctx.runQuery(
		components.betterAuth.institutions.listByUserRole,
		{
			userId: args.userId,
			role: args.role,
		},
	);

	return institutions.map((ins) => ({
		_id: ins._id,
		name: ins.name,
		slug: ins.slug,
		logo: ins.logo,
		createdAt: ins.createdAt,
		metadata: ins.metadata,
	}));
}
