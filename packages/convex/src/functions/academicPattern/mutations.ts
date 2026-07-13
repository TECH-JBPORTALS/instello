import { components } from "../_generated/api";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { userMutation } from "../helpers/customFunctions";
import * as InstitutionAcademicPattern from "../institution/model/institutionAcademicPattern";
import * as StudentCategory from "../institution/model/studentCategory";
import * as OwnerOrganization from "../model/ownerOrganization";
import { vv } from "../schema";
import * as AcademicPattern from "./model/academicPattern";
import * as AcademicStage from "./model/academicStage";
import {
	CreateInputSchema,
	PatchCoreSchema,
	PatchMetadataSchema,
} from "./validator/academicPattern";
import { PatchMetadataSchema as StagePatchMetadataSchema } from "./validator/academicStage";

/** Creates a custom academic pattern with its initial stages for the authenticated owner organization. */
export const create = userMutation({
	args: CreateInputSchema,
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
		body: PatchMetadataSchema,
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
		body: PatchCoreSchema,
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

		const adoptionId = await InstitutionAcademicPattern.adopt(ctx, {
			institutionId: args.institutionId,
			academicPatternId: args.academicPatternId,
			ownerOrganizationId: ownerOrg._id,
		});

		await StudentCategory.seedDefaults(ctx, args.institutionId);

		return adoptionId;
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

/** Updates a stage display name and alias. Allowed even when the parent pattern is locked. */
export const patchStageMetadata = userMutation({
	args: {
		id: vv.id("academicStages"),
		body: StagePatchMetadataSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const stage = await AcademicStage.getById(ctx, args.id);

		if (!stage) {
			throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
		}

		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const pattern = await AcademicPattern.getById(
			ctx,
			stage.academicPatternId,
			ownerOrg._id,
		);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		await AcademicStage.patchMetadata(ctx, args.id, args.body);

		return null;
	},
});
