import type { Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";
import * as AcademicPattern from "./academicPattern";

export async function getByInstitution(
	ctx: AppQueryCtx,
	institutionId: string,
) {
	return await ctx.db
		.query("institutionAcademicPatterns")
		.withIndex("by_institution", (q) => q.eq("institutionId", institutionId))
		.first();
}

export async function getByPattern(
	ctx: AppQueryCtx,
	academicPatternId: Id<"academicPatterns">,
) {
	return await ctx.db
		.query("institutionAcademicPatterns")
		.withIndex("by_academicPattern", (q) =>
			q.eq("academicPatternId", academicPatternId),
		)
		.take(50);
}

export async function adopt(
	ctx: AppMutationCtx,
	args: {
		institutionId: string;
		academicPatternId: Id<"academicPatterns">;
		ownerOrganizationId: Id<"ownerOrganizations">;
	},
) {
	const existing = await getByInstitution(ctx, args.institutionId);

	if (existing) {
		throwAppError(ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.ALREADY_ADOPTED);
	}

	const pattern = await AcademicPattern.getById(
		ctx,
		args.academicPatternId,
		args.ownerOrganizationId,
	);

	if (!pattern) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
	}

	const now = Date.now();

	const adoptionId = await ctx.db.insert("institutionAcademicPatterns", {
		institutionId: args.institutionId,
		academicPatternId: args.academicPatternId,
		ownerOrganizationId: args.ownerOrganizationId,
		createdAt: now,
		updatedAt: now,
	});

	await AcademicPattern.lock(ctx, args.academicPatternId);

	return adoptionId;
}

export async function release(
	ctx: AppMutationCtx,
	args: {
		institutionId: string;
		ownerOrganizationId: Id<"ownerOrganizations">;
	},
) {
	const adoption = await getByInstitution(ctx, args.institutionId);

	if (!adoption) {
		throwAppError(ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.NOT_FOUND);
	}

	if (adoption.ownerOrganizationId !== args.ownerOrganizationId) {
		throwAppError(ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.NOT_FOUND);
	}

	const academicPatternId = adoption.academicPatternId;

	await ctx.db.delete("institutionAcademicPatterns", adoption._id);

	await AcademicPattern.unlockIfUnused(ctx, academicPatternId);
}
