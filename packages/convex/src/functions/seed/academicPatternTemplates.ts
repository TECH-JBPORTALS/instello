import { env, internalMutation } from "../_generated/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import * as AcademicPattern from "../academicPattern/model/academicPattern";

/**
 * Backfill default academic patterns for existing owner organizations.
 *
 * ```bash
 * bun x convex run seed/academicPatternTemplates:backfillDefaults
 * ```
 */
export const backfillDefaults = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!env.SEED_MODE)
			throwAppError(ERROR_CODES.SEED.NOT_ALLOWED_IN_PRODUCTION);

		const ownerOrgs = await ctx.db.query("ownerOrganizations").take(100);

		for (const ownerOrg of ownerOrgs) {
			await AcademicPattern.seedDefaults(ctx, ownerOrg._id);
			await AcademicPattern.normalizeTemplateStages(ctx, ownerOrg._id);
		}

		console.info(
			`Backfilled academic patterns for ${ownerOrgs.length} owner orgs`,
		);
	},
});
