import { components } from "./_generated/api";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery, userQuery } from "./helpers/customFunctions";
import * as Institution from "./model/institution";
import { AdoptedPatternSummarySchema } from "./model/institutionAcademicPattern";
import { vv } from "./schema";

const InstitutionDtoSchema = vv.object({
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
});

const InstitutionPatchSchema = vv.object({
	name: vv.optional(vv.string()),
	addressLine: vv.optional(vv.string()),
	district: vv.optional(vv.string()),
	state: vv.optional(vv.string()),
	country: vv.optional(vv.string()),
	zipCode: vv.optional(vv.string()),
});

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
			adoptedPattern: vv.nullable(AdoptedPatternSummarySchema),
		}),
	),
	handler: async (ctx) => {
		return await Institution.listByUserRole(ctx, {
			role: "owner",
			userId: ctx.session.userId,
		});
	},
});

/**
 * **Check if an institution code is available**
 */
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

/**
 * **Get institution by slug**
 */
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

		return {
			_id: institution._id,
			name: institution.name,
			slug: institution.slug,
			logo: institution.logo,
			code: institution.code,
			addressLine: institution.addressLine,
			district: institution.district,
			state: institution.state,
			country: institution.country,
			zipCode: institution.zipCode,
			createdAt: institution.createdAt,
		};
	},
});

/**
 * **Get the current institution resolved from the URL slug**
 */
export const getCurrent = insQuery({
	args: {},
	returns: InstitutionDtoSchema,
	handler: async (ctx) => {
		return {
			_id: ctx.institution._id,
			name: ctx.institution.name,
			slug: ctx.institution.slug,
			logo: ctx.institution.logo,
			code: ctx.institution.code,
			addressLine: ctx.institution.addressLine,
			district: ctx.institution.district,
			state: ctx.institution.state,
			country: ctx.institution.country,
			zipCode: ctx.institution.zipCode,
			createdAt: ctx.institution.createdAt,
		};
	},
});

/** Update institution profile fields (slug and code are not editable) */
export const update = insMutation({
	args: {
		body: InstitutionPatchSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		if (ctx.membership.role !== "owner") {
			throwAppError(ERROR_CODES.BASE.ACCESS_DENIED);
		}

		const body: Institution.InstitutionPatch = {};
		if (args.body.name !== undefined) body.name = args.body.name.trim();
		if (args.body.addressLine !== undefined)
			body.addressLine = args.body.addressLine.trim();
		if (args.body.district !== undefined)
			body.district = args.body.district.trim();
		if (args.body.state !== undefined) body.state = args.body.state.trim();
		if (args.body.country !== undefined)
			body.country = args.body.country.trim();
		if (args.body.zipCode !== undefined)
			body.zipCode = args.body.zipCode.trim();

		if (Object.keys(body).length === 0) {
			return null;
		}

		await Institution.patch(ctx, ctx.institution._id, body);
		return null;
	},
});
