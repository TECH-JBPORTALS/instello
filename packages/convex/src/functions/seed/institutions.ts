/**
 * seed/institutions
 *
 * Dev-only seed helpers for institution-scoped data.
 * Set SEED_MODE=true in the Convex dashboard before running.
 *
 * ```bash
 * # inside packages/convex
 * bun x convex run seed/institutions:programs '{"institutionId":"<institution-id>"}'
 * bun x convex run seed/institutions:subjects '{"institutionId":"<institution-id>"}'
 * ```
 */

import { v } from "convex/values";
import { components } from "../_generated/api";
import { env, internalMutation, type MutationCtx } from "../_generated/server";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import * as Program from "../program/model/program";
import { vv } from "../schema";
import * as Subject from "../subject/model/subject";
import { SEED_SUBJECTS } from "./mock";

const SEED_PROGRAMS = [
	{ name: "Mechanical Engineering", alias: "ME" },
	{ name: "Computer Science Engineering", alias: "CSE" },
	{ name: "Civil Engineering", alias: "CE" },
	{ name: "Electrical Engineering", alias: "EE" },
	{ name: "Electronics and Communication Engineering", alias: "ECE" },
	{ name: "Information Technology", alias: "IT" },
	{ name: "Chemical Engineering", alias: "CHE" },
	{ name: "Aeronautical Engineering", alias: "AE" },
	{ name: "Biotechnology", alias: "BT" },
	{ name: "Automobile Engineering", alias: "AUTO" },
] as const;

/**
 * **Seeds 10 programs inside the given institution.**
 *
 * Requires SEED_MODE=true. Pass an institution id from your dev deployment.
 */
export const programs = internalMutation({
	args: {
		institutionId: v.string(),
		createdBy: v.optional(v.string()),
	},
	returns: v.array(vv.id("programs")),
	handler: async (ctx, args) => {
		if (!env.SEED_MODE) {
			throwAppError(ERROR_CODES.SEED.NOT_ALLOWED_IN_PRODUCTION);
		}

		await ctx.runQuery(components.betterAuth.institutions.getById, {
			id: args.institutionId,
		});

		const createdBy =
			args.createdBy ?? (await getInstitutionOwnerId(ctx, args.institutionId));

		console.info(`🌱 Seeding ${SEED_PROGRAMS.length} programs`);

		const programIds = [];

		for (const program of SEED_PROGRAMS) {
			const programId = await Program.create(ctx, {
				name: program.name,
				alias: program.alias,
				institutionId: args.institutionId,
				createdBy,
			});

			programIds.push(programId);
			console.info(` ✅ ${program.name} (${program.alias}) created`);
		}

		return programIds;
	},
});

/**
 * **Seeds 55 subjects inside the given institution.**
 *
 * Requires SEED_MODE=true. Pass an institution id from your dev deployment.
 */
export const subjects = internalMutation({
	args: {
		institutionId: v.string(),
	},
	returns: v.array(vv.id("subjects")),
	handler: async (ctx, args) => {
		if (!env.SEED_MODE) {
			throwAppError(ERROR_CODES.SEED.NOT_ALLOWED_IN_PRODUCTION);
		}

		await ctx.runQuery(components.betterAuth.institutions.getById, {
			id: args.institutionId,
		});

		console.info(`🌱 Seeding ${SEED_SUBJECTS.length} subjects`);

		const subjectIds = [];

		for (const subject of SEED_SUBJECTS) {
			const subjectId = await Subject.create(ctx, {
				name: subject.name,
				code: subject.code,
				alias: subject.alias,
				color: subject.color,
				institutionId: args.institutionId,
			});

			subjectIds.push(subjectId);
			console.info(` ✅ ${subject.name} (${subject.code}) created`);
		}

		return subjectIds;
	},
});

async function getInstitutionOwnerId(
	ctx: MutationCtx,
	institutionId: string,
): Promise<string> {
	const members = await ctx.runQuery(components.betterAuth.adapter.findMany, {
		model: "institutionMember",
		select: ["userId"],
		paginationOpts: { numItems: 1, cursor: null },
		where: [
			{ field: "organizationId", operator: "eq", value: institutionId },
			{ field: "role", operator: "eq", value: "owner" },
		],
	});

	const owner = members.page[0];

	if (!owner) {
		throw new Error(
			"No owner found for institution. Pass createdBy explicitly.",
		);
	}

	return owner.userId;
}
