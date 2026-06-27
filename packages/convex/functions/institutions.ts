import { userQuery } from "./helpers/customFunctions";
import * as Institution from "./model/institution";
import { vv } from "./schema";

/**
 * **List all institutions owned by the current user**
 * */
export const listMyOwned = userQuery({
	args: {},
	returns: vv.array(
		vv.object({
			_id: vv.string(),
			name: vv.string(),
			slug: vv.string(),
			logo: vv.optional(vv.union(vv.string(), vv.null())),
			metadata: vv.optional(vv.union(vv.string(), vv.null())),
			createdAt: vv.number(),
		}),
	),
	handler: async (ctx) => {
		return await Institution.listByUserRole(ctx, {
			role: "owner",
			userId: ctx.session.userId,
		});
	},
});
