import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery, userQuery } from "../helpers/customFunctions";
import * as InstitutionAcademicPattern from "../institution/model/institutionAcademicPattern";
import * as OwnerOrganization from "../model/ownerOrganization";
import { vv } from "../schema";
import * as AcademicPattern from "./model/academicPattern";
import {
	AcademicPatternDetailDtoSchema,
	AcademicPatternDtoSchema,
} from "./validator/academicPattern";

/** Lists academic patterns belonging to the authenticated owner organization. */
export const list = userQuery({
	args: {},
	returns: vv.array(AcademicPatternDtoSchema),
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
	returns: AcademicPatternDetailDtoSchema,
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

/** Returns the academic pattern adopted by the active institution, if any. */
export const getAdoptedForActiveInstitution = insQuery({
	permissions: ["class:view"],
	args: {},
	returns: vv.nullable(AcademicPatternDetailDtoSchema),
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
