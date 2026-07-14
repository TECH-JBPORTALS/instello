/**
 * seed/timetables
 *
 * Dev-only seed helpers for class timetables.
 * Set SEED_MODE=true in the Convex dashboard before running.
 *
 * Requires subjects already seeded for the institution
 * (`seed/institutions:subjects`).
 *
 * ```bash
 * # inside packages/convex
 * bun x convex run seed/timetables:setForClass '{"classId":"<class-id>"}'
 * ```
 */

import { v } from "convex/values";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { env, internalMutation, type MutationCtx } from "../_generated/server";
import * as AttendanceRegister from "../attendance/model/register";
import * as Class from "../class/model/class";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import * as Subject from "../subject/model/subject";
import * as Timetable from "../timetable/model/timetable";
import type { SlotInput } from "../timetable/validator/timetable";

const THEORY_ALIASES = ["mathematics", "engineering-physics"] as const;
const LAB_ALIASES = ["data-structures-lab", "oop-lab"] as const;

/**
 * **Seeds a weekly timetable for the given class.**
 *
 * Requires SEED_MODE=true. Subjects must already exist in the class's institution
 * (aliases: mathematics, engineering-physics, data-structures-lab, oop-lab).
 */
export const setForClass = internalMutation({
	args: {
		classId: vv.id("classes"),
		createdBy: v.optional(v.string()),
		changeMessage: v.optional(v.string()),
	},
	returns: v.object({
		timetableId: vv.id("timetable"),
		version: v.number(),
		slotCount: v.number(),
	}),
	handler: async (ctx, args) => {
		if (!env.SEED_MODE) {
			throwAppError(ERROR_CODES.SEED.NOT_ALLOWED_IN_PRODUCTION);
		}

		const cls = await Class.getById(ctx, args.classId);
		if (!cls) {
			throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
		}

		const program = await ctx.db.get(
			"programs",
			cls.programId as Id<"programs">,
		);
		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		const institutionId = program.institutionId;
		const createdBy =
			args.createdBy ?? (await getInstitutionOwnerId(ctx, institutionId));

		const math = await requireSubject(ctx, institutionId, THEORY_ALIASES[0]);
		const physics = await requireSubject(ctx, institutionId, THEORY_ALIASES[1]);
		const labA = await requireSubject(ctx, institutionId, LAB_ALIASES[0]);
		const labB = await requireSubject(ctx, institutionId, LAB_ALIASES[1]);

		const batches = cls.isGroupsEnabled
			? await ctx.db
					.query("classBatches")
					.withIndex("by_class", (q) => q.eq("classId", cls._id))
					.collect()
			: [];

		const sortedBatches = [...batches].sort((a, b) => a.numIdx - b.numIdx);
		const batch1 = sortedBatches[0]?._id;
		const batch2 = sortedBatches[1]?._id;

		const slots = buildWeeklySlots({
			mathId: math._id,
			physicsId: physics._id,
			labAId: labA._id,
			labBId: labB._id,
			batch1,
			batch2,
		});

		console.info(
			`🌱 Seeding timetable for class ${cls.name} (${cls.slug}) with ${slots.length} slots`,
		);

		const timetable = await Timetable.create(ctx, {
			classId: cls._id,
			institutionId,
			createdBy,
			changeMessage: args.changeMessage ?? "Seeded timetable",
			slots,
		});

		await AttendanceRegister.syncFromTimetable(ctx, {
			classId: cls._id,
			slots,
		});

		console.info(
			` ✅ Timetable v${timetable.version} created (${timetable._id})`,
		);

		return {
			timetableId: timetable._id,
			version: timetable.version,
			slotCount: slots.length,
		};
	},
});

async function requireSubject(
	ctx: MutationCtx,
	institutionId: string,
	alias: string,
) {
	const subject = await Subject.findByAlias(ctx, institutionId, alias);
	if (!subject) {
		throw new Error(
			`Missing subject alias "${alias}" in institution. Run seed/institutions:subjects first. Required aliases: ${[...THEORY_ALIASES, ...LAB_ALIASES].join(", ")}`,
		);
	}
	return subject;
}

function buildWeeklySlots(args: {
	mathId: Id<"subjects">;
	physicsId: Id<"subjects">;
	labAId: Id<"subjects">;
	labBId: Id<"subjects">;
	batch1?: Id<"classBatches">;
	batch2?: Id<"classBatches">;
}): SlotInput[] {
	const slots: SlotInput[] = [];

	const theoryDay = (day: number) => {
		slots.push(
			{
				subjectId: args.mathId,
				day,
				startHour: 0,
				endHour: 1,
			},
			{
				subjectId: args.physicsId,
				day,
				startHour: 1,
				endHour: 2,
			},
		);

		// Auto-style lab (hours 2–4)
		if (args.batch1) {
			slots.push({
				subjectId: args.labAId,
				batchId: args.batch1,
				day,
				startHour: 2,
				endHour: 4,
			});
		} else {
			slots.push({
				subjectId: args.labAId,
				day,
				startHour: 2,
				endHour: 4,
			});
		}

		// IT-style lab (hours 4–7), stacked batches when present
		if (args.batch1 && args.batch2) {
			slots.push(
				{
					subjectId: args.labBId,
					batchId: args.batch1,
					day,
					startHour: 4,
					endHour: 7,
				},
				{
					subjectId: args.labBId,
					batchId: args.batch2,
					day,
					startHour: 4,
					endHour: 7,
				},
			);
		} else if (args.batch1) {
			slots.push({
				subjectId: args.labBId,
				batchId: args.batch1,
				day,
				startHour: 4,
				endHour: 7,
			});
		} else {
			slots.push({
				subjectId: args.labBId,
				day,
				startHour: 4,
				endHour: 7,
			});
		}
	};

	const labFirstDay = (day: number) => {
		if (args.batch1 && args.batch2) {
			slots.push(
				{
					subjectId: args.labBId,
					batchId: args.batch1,
					day,
					startHour: 0,
					endHour: 3,
				},
				{
					subjectId: args.labBId,
					batchId: args.batch2,
					day,
					startHour: 0,
					endHour: 3,
				},
			);
		} else if (args.batch1) {
			slots.push({
				subjectId: args.labBId,
				batchId: args.batch1,
				day,
				startHour: 0,
				endHour: 3,
			});
		} else {
			slots.push({
				subjectId: args.labBId,
				day,
				startHour: 0,
				endHour: 3,
			});
		}

		slots.push(
			{
				subjectId: args.physicsId,
				day,
				startHour: 3,
				endHour: 4,
			},
			{
				subjectId: args.mathId,
				day,
				startHour: 4,
				endHour: 5,
			},
		);

		if (args.batch1) {
			slots.push({
				subjectId: args.labAId,
				batchId: args.batch1,
				day,
				startHour: 5,
				endHour: 7,
			});
		} else {
			slots.push({
				subjectId: args.labAId,
				day,
				startHour: 5,
				endHour: 7,
			});
		}
	};

	const saturdayHalfDay = (day: number) => {
		if (args.batch1 && args.batch2) {
			slots.push(
				{
					subjectId: args.labBId,
					batchId: args.batch1,
					day,
					startHour: 0,
					endHour: 2,
				},
				{
					subjectId: args.labBId,
					batchId: args.batch2,
					day,
					startHour: 0,
					endHour: 2,
				},
			);
		} else if (args.batch1) {
			slots.push({
				subjectId: args.labBId,
				batchId: args.batch1,
				day,
				startHour: 0,
				endHour: 2,
			});
		} else {
			slots.push({
				subjectId: args.labBId,
				day,
				startHour: 0,
				endHour: 2,
			});
		}

		slots.push({
			subjectId: args.physicsId,
			day,
			startHour: 2,
			endHour: 3,
		});
	};

	// Mon / Wed / Fri
	theoryDay(0);
	theoryDay(2);
	theoryDay(4);

	// Tue / Thu
	labFirstDay(1);
	labFirstDay(3);

	// Sat
	saturdayHalfDay(5);

	return slots;
}

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
