import type { InsRole } from "../better-auth/ins-permissions";
import { components } from "./_generated/api";
import { insQuery, userQuery } from "./helpers/customFunctions";
import { formInstitutionUrl } from "./helpers/utils";
import * as OwnerOrganizations from "./model/ownerOrganization";
import { vv } from "./schema";

export const resolveLandingPath = userQuery({
	args: { slug: vv.string() },
	returns: {
		redirectUrl: vv.string(),
	},
	handler: async (ctx) => {
		const user = await ctx.runQuery(components.betterAuth.users.getById, {
			userId: ctx.session.userId,
		});

		if (user.role === "owner") {
			const organization = await OwnerOrganizations.getByUserId(ctx, {
				userId: ctx.session.userId,
			});

			return {
				redirectUrl: organization
					? `/${organization.slug}`
					: "/owner/onboarding",
			};
		}

		if (ctx.session.activeInstitutionId) {
			const institution = await ctx.runQuery(
				components.betterAuth.institutions.getById,
				{
					id: ctx.session.activeInstitutionId,
				},
			);

			return {
				redirectUrl: institution
					? formInstitutionUrl(institution.slug)
					: "/institution-not-found",
			};
		}

		return {
			redirectUrl: "/not-part-of-any-institution",
		};
	},
});

export const getCurrentUserInInstitution = insQuery({
	args: {},
	returns: vv.object({
		_id: vv.string(),
		email: vv.string(),
		image: vv.nullable(vv.string()),
		name: vv.string(),
		role: vv.union(
			vv.literal("owner"),
			vv.literal("faculty"),
			vv.literal("principal"),
		),
	}),
	handler: (ctx) => {
		return {
			_id: ctx.session.user._id,
			email: ctx.session.user.email,
			image: ctx.session.user.name,
			name: ctx.session.user.name,
			role: ctx.membership.role as InsRole,
		};
	},
});
