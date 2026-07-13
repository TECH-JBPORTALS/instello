import { components } from "../_generated/api";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery, userQuery } from "../helpers/customFunctions";
import { vv } from "../schema";
import * as Institution from "./model/institution";
import {
	InstitutionDtoSchema,
	InstitutionListItemSchema,
} from "./validator/institution";

/** List all institutions owned by the current user */
export const listMyOwned = userQuery({
	args: {},
	returns: vv.array(InstitutionListItemSchema),
	handler: async (ctx) => {
		// List all owner owned institutions
		const institutions = await ctx.runQuery(
			components.betterAuth.institutions.listByUserRole,
			{
				userId: ctx.session.userId,
				role: "owner",
			},
		);

		return Promise.all(
			institutions.map(
				async (institution) => await Institution.toDto(ctx, institution),
			),
		);
	},
});

/** Check if an institution code is available */
export const checkCode = userQuery({
	args: { code: vv.string() },
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const code = args.code.trim();
		if (!code) return { available: false };

		const existing = await ctx.runQuery(
			components.betterAuth.institutions.getByCode,
			{ code },
		);

		return { available: existing === null };
	},
});

/** Get institution by slug */
export const getBySlug = userQuery({
	args: { slug: vv.string() },
	returns: InstitutionDtoSchema,
	handler: async (ctx, args) => {
		const slug = args.slug.trim();

		const institution = await ctx.runQuery(
			components.betterAuth.institutions.getBySlug,
			{ slug },
		);

		if (!institution)
			throwAppError(ERROR_CODES.ORGANIZATION.ORGANIZATION_NOT_FOUND);

		return await Institution.toDto(ctx, institution);
	},
});

/** Get the current institution resolved from the URL slug */
export const getCurrent = insQuery({
	args: {},
	returns: InstitutionDtoSchema,
	handler: async (ctx) => {
		return await Institution.toDto(ctx, ctx.institution);
	},
});
