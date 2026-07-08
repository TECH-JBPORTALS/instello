import { components } from "../_generated/api";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";
import * as InstitutionAcademicPattern from "./institutionAcademicPattern";

export type InstitutionPatch = {
	name?: string;
	addressLine?: string;
	district?: string;
	state?: string;
	country?: string;
	zipCode?: string;
};

/**
 * **List all institutions by user and role**
 * @param ctx AppCtx
 * @param args userId and role
 */
export async function listByUserRole(
	ctx: AppQueryCtx,
	args: { userId: string; role: "owner" | "faculty" | "principal" },
) {
	const institutions = await ctx.runQuery(
		components.betterAuth.institutions.listByUserRole,
		{
			userId: args.userId,
			role: args.role,
		},
	);

	return Promise.all(
		institutions.map(async (ins) => ({
			_id: ins._id,
			name: ins.name,
			slug: ins.slug,
			logo: ins.logo,
			createdAt: ins.createdAt,
			code: ins.code,
			addressLine: ins.addressLine,
			district: ins.district,
			state: ins.state,
			country: ins.country,
			zipCode: ins.zipCode,
			adoptedPattern: await InstitutionAcademicPattern.getAdoptedPatternSummary(
				ctx,
				ins._id,
			),
		})),
	);
}

export async function patch(
	ctx: AppMutationCtx,
	institutionId: string,
	body: InstitutionPatch,
) {
	await ctx.runMutation(components.betterAuth.adapter.updateOne, {
		input: {
			model: "institution",
			where: [{ field: "_id", value: institutionId }],
			update: body,
		},
	});
}
