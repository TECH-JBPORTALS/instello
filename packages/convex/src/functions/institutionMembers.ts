import { ConvexError } from "convex/values";
import { components } from "./_generated/api";
import { userQuery } from "./helpers/customFunctions";
import { ERROR_CODES } from "./helpers/errors";
import { vv } from "./schema";

export const getMyInstitutionContext = userQuery({
	args: { slug: vv.string() },
	returns: vv.object({
		name: vv.string(),
		image: vv.nullable(vv.string()),
		role: vv.string(),
	}),
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(components.betterAuth.users.getById, {
			userId: ctx.session.userId,
		});

		const institution = await ctx.runQuery(
			components.betterAuth.institutions.getBySlug,
			{ slug: args.slug },
		);

		if (!institution) {
			throw new ConvexError(ERROR_CODES.ORGANIZATION.ORGANIZATION_NOT_FOUND);
		}

		const membership = await ctx.runQuery(
			components.betterAuth.institutions.getMembership,
			{
				userId: ctx.session.userId,
				organizationId: institution._id,
			},
		);

		if (!membership) {
			throw new ConvexError(
				ERROR_CODES.ORGANIZATION.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION,
			);
		}

		return {
			name: user.name,
			image: user.image,
			role: membership.role,
		};
	},
});
