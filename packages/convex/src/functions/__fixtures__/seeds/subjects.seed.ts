import type { Doc } from "#_generated/dataModel";
import type { AppMutationCtx } from "#model/common.types";
import {
	SUBJECT_APPLIED_SCIENCE,
	SUBJECT_MATH,
	SUBJECT_PHYSICS,
} from "../constants.setup";

export type SeededSubjects = {
	math: Doc<"subjects">;
	appliedScience: Doc<"subjects">;
	physics: Doc<"subjects">;
};

export async function seedSubjects(
	ctx: AppMutationCtx,
	args: {
		ins1: { _id: string };
		ins2: { _id: string };
	},
): Promise<SeededSubjects> {
	const now = Date.now();

	const mathId = await ctx.db.insert("subjects", {
		name: SUBJECT_MATH.name,
		code: SUBJECT_MATH.code,
		alias: SUBJECT_MATH.alias,
		color: SUBJECT_MATH.color,
		createdAt: now,
		updatedAt: now,
		institutionId: args.ins1._id,
		status: "active",
	});

	const appliedScienceId = await ctx.db.insert("subjects", {
		name: SUBJECT_APPLIED_SCIENCE.name,
		code: SUBJECT_APPLIED_SCIENCE.code,
		alias: SUBJECT_APPLIED_SCIENCE.alias,
		color: SUBJECT_APPLIED_SCIENCE.color,
		createdAt: now,
		updatedAt: now,
		institutionId: args.ins1._id,
		status: "active",
	});

	const physicsId = await ctx.db.insert("subjects", {
		name: SUBJECT_PHYSICS.name,
		code: SUBJECT_PHYSICS.code,
		alias: SUBJECT_PHYSICS.alias,
		color: SUBJECT_PHYSICS.color,
		createdAt: now,
		updatedAt: now,
		institutionId: args.ins2._id,
		status: "active",
	});

	const math = await ctx.db.get("subjects", mathId);
	const appliedScience = await ctx.db.get("subjects", appliedScienceId);
	const physics = await ctx.db.get("subjects", physicsId);

	if (!math || !appliedScience || !physics) {
		throw new Error("Failed to seed subjects");
	}

	return { math, appliedScience, physics };
}
