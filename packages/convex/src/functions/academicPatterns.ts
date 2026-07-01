import { components } from "./_generated/api";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insQuery, userMutation, userQuery } from "./helpers/customFunctions";
import * as AcademicPattern from "./model/academicPattern";
import * as InstitutionAcademicPattern from "./model/institutionAcademicPattern";
import * as OwnerOrganization from "./model/ownerOrganization";
import { vv } from "./schema";

/** Lists academic patterns belonging to the authenticated owner organization. */
export const list = userQuery({
	args: {},
	returns: vv.array(AcademicPattern.AcademicPatternDtoSchema),
	handler: async (ctx) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		return await AcademicPattern.listByOwnerOrg(ctx, ownerOrg._id);
	},
});

/** Returns an academic pattern and its ordered stages for the authenticated owner organization. */
export const getById = userQuery({
	args: { id: vv.id("academicPatterns") },
	returns: AcademicPattern.AcademicPatternDetailDtoSchema,
	handler: async (ctx, args) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const pattern = await AcademicPattern.getById(ctx, args.id, ownerOrg._id);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		return await AcademicPattern.toDetailDto(ctx, pattern);
	},
});

/** Creates a custom academic pattern with its initial stages for the authenticated owner organization. */
export const create = userMutation({
	args: AcademicPattern.CreateInputSchema,
	returns: vv.id("academicPatterns"),
	handler: async (ctx, args) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		return await AcademicPattern.create(ctx, {
			...args,
			ownerOrganizationId: ownerOrg._id,
		});
	},
});

/** Updates pattern name and description. Allowed even when core structure is locked. */
export const patchMetadata = userMutation({
	args: {
		id: vv.id("academicPatterns"),
		body: AcademicPattern.PatchMetadataSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const pattern = await AcademicPattern.getById(ctx, args.id, ownerOrg._id);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		await AcademicPattern.patchMetadata(ctx, args.id, args.body);

		return null;
	},
});

/**
 * Updates system type and/or duration for an editable pattern.
 * Resyncs stages when either core field changes.
 */
export const patchCore = userMutation({
	args: {
		id: vv.id("academicPatterns"),
		body: AcademicPattern.PatchCoreSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const pattern = await AcademicPattern.getById(ctx, args.id, ownerOrg._id);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		await AcademicPattern.patchCore(ctx, args.id, args.body);

		return null;
	},
});

/** Adopts an academic pattern for an institution and locks the pattern core structure. */
export const adopt = userMutation({
	args: {
		institutionId: vv.string(),
		academicPatternId: vv.id("academicPatterns"),
	},
	returns: vv.id("institutionAcademicPatterns"),
	handler: async (ctx, args) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const membership = await ctx.runQuery(
			components.betterAuth.institutions.getMembership,
			{
				organizationId: args.institutionId,
				userId: ctx.session.userId,
			},
		);

		if (membership?.role !== "owner") {
			throwAppError(ERROR_CODES.BASE.ACCESS_DENIED);
		}

		return await InstitutionAcademicPattern.adopt(ctx, {
			institutionId: args.institutionId,
			academicPatternId: args.academicPatternId,
			ownerOrganizationId: ownerOrg._id,
		});
	},
});

/** Releases an institution's adopted pattern and unlocks the pattern when no adoptions remain. */
export const release = userMutation({
	args: { institutionId: vv.string() },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const membership = await ctx.runQuery(
			components.betterAuth.institutions.getMembership,
			{
				organizationId: args.institutionId,
				userId: ctx.session.userId,
			},
		);

		if (membership?.role !== "owner") {
			throwAppError(ERROR_CODES.BASE.ACCESS_DENIED);
		}

		await InstitutionAcademicPattern.release(ctx, {
			institutionId: args.institutionId,
			ownerOrganizationId: ownerOrg._id,
		});

		return null;
	},
});

/** Returns the academic pattern adopted by an institution, if any. */
export const getByInstitution = userQuery({
	args: { institutionId: vv.string() },
	returns: vv.nullable(AcademicPattern.AcademicPatternDetailDtoSchema),
	handler: async (ctx, args) => {
		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const membership = await ctx.runQuery(
			components.betterAuth.institutions.getMembership,
			{
				organizationId: args.institutionId,
				userId: ctx.session.userId,
			},
		);

		if (membership?.role !== "owner") {
			throwAppError(ERROR_CODES.BASE.ACCESS_DENIED);
		}

		const adoption = await InstitutionAcademicPattern.getByInstitution(
			ctx,
			args.institutionId,
		);

		if (!adoption) return null;

		const pattern = await AcademicPattern.getById(
			ctx,
			adoption.academicPatternId,
			ownerOrg._id,
		);

		if (!pattern) return null;

		return await AcademicPattern.toDetailDto(ctx, pattern);
	},
});


/** Returns the academic pattern adopted by the active institution, if any. */
export const getAdoptedForActiveInstitution = insQuery({
	permissions: ["class:view"],
	args: {},
	returns: vv.nullable(AcademicPattern.AcademicPatternDetailDtoSchema),
	handler: async (ctx) => {
		const adoption = await InstitutionAcademicPattern.getByInstitution(
			ctx,
			ctx.institution._id,
		);

		if (!adoption) return null;

		const pattern = await ctx.db.get(
			"academicPatterns",
			adoption.academicPatternId,
		);

		if (!pattern) return null;

		return await AcademicPattern.toDetailDto(ctx, pattern);
	},
});
