import { components } from "./_generated/api";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import type { UserMutationCtx, UserQueryCtx } from "./helpers/customFunctions";
import { userMutation, userQuery } from "./helpers/customFunctions";
import * as AcademicPattern from "./model/academicPattern";
import * as InstitutionAcademicPattern from "./model/institutionAcademicPattern";
import * as OwnerOrganization from "./model/ownerOrganization";
import { vv } from "./schema";

async function requireOwnerOrg(ctx: UserQueryCtx | UserMutationCtx) {
	const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
		userId: ctx.session.userId,
	});

	if (!ownerOrg) {
		throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
	}

	return ownerOrg;
}

/** List all academic patterns for the current owner organization */
export const list = userQuery({
	args: {},
	returns: vv.array(AcademicPattern.AcademicPatternDtoSchema),
	handler: async (ctx) => {
		const ownerOrg = await requireOwnerOrg(ctx);

		return await AcademicPattern.listByOwnerOrg(ctx, ownerOrg._id);
	},
});

/** Get academic pattern by id with its stages */
export const getById = userQuery({
	args: { id: vv.id("academicPatterns") },
	returns: AcademicPattern.AcademicPatternDetailDtoSchema,
	handler: async (ctx, args) => {
		const ownerOrg = await requireOwnerOrg(ctx);

		const pattern = await AcademicPattern.getById(ctx, args.id, ownerOrg._id);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		return await AcademicPattern.toDetailDto(ctx, pattern);
	},
});

/** Create a custom academic pattern with initial stages */
export const create = userMutation({
	args: AcademicPattern.CreateInputSchema,
	returns: vv.id("academicPatterns"),
	handler: async (ctx, args) => {
		const ownerOrg = await requireOwnerOrg(ctx);

		return await AcademicPattern.create(ctx, {
			...args,
			ownerOrganizationId: ownerOrg._id,
		});
	},
});

/** Update pattern name and description (always allowed) */
export const patchMetadata = userMutation({
	args: {
		id: vv.id("academicPatterns"),
		body: AcademicPattern.PatchMetadataSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const ownerOrg = await requireOwnerOrg(ctx);

		const pattern = await AcademicPattern.getById(ctx, args.id, ownerOrg._id);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		await AcademicPattern.patchMetadata(ctx, args.id, args.body);

		return null;
	},
});

/** Update pattern core fields (only when canBeEdited is true) */
export const patchCore = userMutation({
	args: {
		id: vv.id("academicPatterns"),
		body: AcademicPattern.PatchCoreSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const ownerOrg = await requireOwnerOrg(ctx);

		const pattern = await AcademicPattern.getById(ctx, args.id, ownerOrg._id);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		await AcademicPattern.patchCore(ctx, args.id, args.body);

		return null;
	},
});

/** Adopt an academic pattern for an institution owned by the current user */
export const adopt = userMutation({
	args: {
		institutionId: vv.string(),
		academicPatternId: vv.id("academicPatterns"),
	},
	returns: vv.id("institutionAcademicPatterns"),
	handler: async (ctx, args) => {
		const ownerOrg = await requireOwnerOrg(ctx);

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

/** Release the adopted academic pattern from an institution */
export const release = userMutation({
	args: { institutionId: vv.string() },
	returns: vv.null(),
	handler: async (ctx, args) => {
		const ownerOrg = await requireOwnerOrg(ctx);

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

/** Get the adopted academic pattern for an institution */
export const getByInstitution = userQuery({
	args: { institutionId: vv.string() },
	returns: vv.nullable(AcademicPattern.AcademicPatternDetailDtoSchema),
	handler: async (ctx, args) => {
		const ownerOrg = await requireOwnerOrg(ctx);

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
