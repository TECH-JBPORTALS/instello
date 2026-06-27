import { components } from "./_generated/api";
import { userQuery } from "./helpers/customFunctions";
import { formInstitutionUrl } from "./helpers/utils";
import * as OwnerOrganizations from "./model/ownerOrganization";
import { vv } from "./schema";

export const resolveLandingPath = userQuery({
	args: {},
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
