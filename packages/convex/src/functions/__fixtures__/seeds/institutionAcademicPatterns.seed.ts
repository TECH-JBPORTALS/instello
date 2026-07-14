import type { Doc, Id } from "#_generated/dataModel";
import * as AcademicStage from "#academicPattern/model/academicStage";
import * as InstitutionAcademicPattern from "#institution/model/institutionAcademicPattern";
import type { AppMutationCtx } from "#model/common.types";

export type SeededAcademicAdoptions = {
	ins1PatternId: Id<"academicPatterns">;
	ins2PatternId: Id<"academicPatterns">;
	ins1FirstStage: Doc<"academicStages">;
	ins2FirstStage: Doc<"academicStages">;
	ins1SecondStage: Doc<"academicStages">;
};

export async function seedInstitutionAcademicPatterns(
	ctx: AppMutationCtx,
	args: {
		ownerOrg1Id: Id<"ownerOrganizations">;
		ownerOrg2Id: Id<"ownerOrganizations">;
		ins1Id: string;
		ins2Id: string;
	},
): Promise<SeededAcademicAdoptions> {
	const patterns = await ctx.db
		.query("academicPatterns")
		.withIndex("by_ownerOrganization", (q) =>
			q.eq("ownerOrganizationId", args.ownerOrg1Id),
		)
		.collect();

	const engineeringPattern = patterns.find(
		(p) => p.templateKey === "engineering",
	);

	if (!engineeringPattern) {
		throw new Error("Engineering pattern not found for owner org 1");
	}

	const patterns2 = await ctx.db
		.query("academicPatterns")
		.withIndex("by_ownerOrganization", (q) =>
			q.eq("ownerOrganizationId", args.ownerOrg2Id),
		)
		.collect();

	const engineeringPattern2 = patterns2.find(
		(p) => p.templateKey === "engineering",
	);

	if (!engineeringPattern2) {
		throw new Error("Engineering pattern not found for owner org 2");
	}

	await InstitutionAcademicPattern.adopt(ctx, {
		institutionId: args.ins1Id,
		academicPatternId: engineeringPattern._id,
		ownerOrganizationId: args.ownerOrg1Id,
	});

	await InstitutionAcademicPattern.adopt(ctx, {
		institutionId: args.ins2Id,
		academicPatternId: engineeringPattern2._id,
		ownerOrganizationId: args.ownerOrg2Id,
	});

	const ins1Stages = await AcademicStage.listByPattern(
		ctx,
		engineeringPattern._id,
	);
	const ins2Stages = await AcademicStage.listByPattern(
		ctx,
		engineeringPattern2._id,
	);

	const ins1FirstStage = ins1Stages[0];
	const ins1SecondStage = ins1Stages[1];
	const ins2FirstStage = ins2Stages[0];

	if (!ins1FirstStage || !ins1SecondStage || !ins2FirstStage) {
		throw new Error("Failed to load academic stages for test institutions");
	}

	return {
		ins1PatternId: engineeringPattern._id,
		ins2PatternId: engineeringPattern2._id,
		ins1FirstStage,
		ins2FirstStage,
		ins1SecondStage,
	};
}
