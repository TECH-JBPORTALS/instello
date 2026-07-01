import { components } from "../_generated/api";
import type { AppQueryCtx } from "./common.types";
import * as InstitutionAcademicPattern from "./institutionAcademicPattern";

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
