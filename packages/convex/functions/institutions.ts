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
			code: vv.string(),
			addressLine: vv.string(),
			district: vv.string(),
			state: vv.string(),
			country: vv.string(),
			zipCode: vv.string(),
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
