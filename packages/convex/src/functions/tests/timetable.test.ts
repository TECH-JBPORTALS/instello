import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ERROR_CODES } from "../helpers/constants";
import { buildDefaultPeriods, timeOfDayMs } from "../helpers/timetableSchedule";
import {
	classTest,
	expectAppError,
	seedSubjects,
	withSlug,
} from "./fixtures/index.setup";

const timetableTest = classTest().extend(
	"subjects",
	async ({ t, ins1, ins2 }) =>
		await t.run((ctx) => seedSubjects(ctx, { ins1, ins2 })),
);

function createSlots(args: {
	mathId: Id<"subjects">;
	scienceId: Id<"subjects">;
	batchId?: Id<"classBatches">;
}) {
	return [
		{
			subjectId: args.mathId,
			day: 0,
			startHour: 0,
			endHour: 1,
		},
		{
			subjectId: args.scienceId,
			day: 0,
			startHour: 1,
			endHour: 2,
		},
		{
			subjectId: args.mathId,
			day: 1,
			startHour: 0,
			endHour: 2,
			...(args.batchId ? { batchId: args.batchId } : {}),
		},
	];
}

function createInput(args: {
	programId: Id<"programs">;
	classAlias: string;
	mathId: Id<"subjects">;
	scienceId: Id<"subjects">;
	batchId?: Id<"classBatches">;
	changeMessage?: string;
}) {
	return {
		programId: args.programId,
		classAlias: args.classAlias,
		changeMessage: args.changeMessage ?? "Initial timetable",
		slots: createSlots({
			mathId: args.mathId,
			scienceId: args.scienceId,
			batchId: args.batchId,
		}),
	};
}

describe("timetables.create", () => {
	const test = timetableTest;

	test("rejects unauthenticated user", async ({
		t,
		ins1,
		programs,
		classes,
		subjects,
	}) => {
		await expectAppError(
			t.mutation(
				api.timetables.create,
				withSlug(
					ins1,
					createInput({
						programId: programs.me._id,
						classAlias: classes.class1.slug,
						mathId: subjects.math._id,
						scienceId: subjects.appliedScience._id,
					}),
				),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("creates version 1 with slots including day", async ({
		t,
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const result = await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(
				ins1,
				createInput({
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
				}),
			),
		);

		expect(result.version).toBe(1);
		expect(result.changeMessage).toBe("Initial timetable");
		expect(result.slots).toHaveLength(3);
		expect(result.slots[0]).toMatchObject({
			day: 0,
			startHour: 0,
			endHour: 1,
			subject: {
				_id: subjects.math._id,
				name: subjects.math.name,
				alias: subjects.math.alias,
			},
		});
		expect(result.commitedBy).toMatchObject({
			_id: user1._id,
			firstName: expect.any(String),
			lastName: expect.any(String),
		});
		expect(result.sessionConfig.totalHours).toBe(7);
		expect(result.sessionConfig.periods).toHaveLength(7);

		const registers = await t.run((ctx) =>
			ctx.db.query("attendanceRegisters").collect(),
		);
		expect(registers).toHaveLength(2);
	});

	test("stores custom session config on create", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const periods = buildDefaultPeriods(5);
		const afterPeriod = 2;
		const lunchDurationMs = 45 * 60 * 1000;
		const lunchStart = periods[afterPeriod - 1]?.endTime;
		const shiftedPeriods = periods.map((period, index) => {
			if (index < afterPeriod) {
				return period;
			}
			return {
				startTime: period.startTime + lunchDurationMs,
				endTime: period.endTime + lunchDurationMs,
			};
		});
		const sessionConfig = {
			totalHours: 5,
			periods: shiftedPeriods,
			lunchBreak: {
				enabled: true,
				afterPeriod,
				startTime: lunchStart,
				endTime: lunchStart + lunchDurationMs,
			},
		};

		const result = await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(ins1, {
				...createInput({
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
				}),
				sessionConfig,
			}),
		);

		expect(result.sessionConfig).toMatchObject(sessionConfig);
	});

	test("rejects invalid session config", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.timetables.create,
				withSlug(ins1, {
					...createInput({
						programId: programs.me._id,
						classAlias: classes.class1.slug,
						mathId: subjects.math._id,
						scienceId: subjects.appliedScience._id,
					}),
					sessionConfig: {
						totalHours: 4,
						periods: [
							{
								startTime: timeOfDayMs(9, 0),
								endTime: timeOfDayMs(10, 0),
							},
							{
								startTime: timeOfDayMs(9, 30),
								endTime: timeOfDayMs(10, 30),
							},
							{
								startTime: timeOfDayMs(10, 30),
								endTime: timeOfDayMs(11, 15),
							},
							{
								startTime: timeOfDayMs(11, 15),
								endTime: timeOfDayMs(12, 0),
							},
						],
					},
				}),
			),
			ERROR_CODES.TIMETABLE.INVALID_SESSION_CONFIG,
		);
	});

	test("bumps version on second create", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const authed = asOwner(user1, ins1);
		const input = withSlug(
			ins1,
			createInput({
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				mathId: subjects.math._id,
				scienceId: subjects.appliedScience._id,
			}),
		);

		const v1 = await authed.mutation(api.timetables.create, input);
		const v2 = await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...createInput({
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
					changeMessage: "Updated schedule",
				}),
			}),
		);

		expect(v1.version).toBe(1);
		expect(v2.version).toBe(2);
		expect(v2.changeMessage).toBe("Updated schedule");
	});

	test("rejects unknown class", async ({
		ins1,
		programs,
		subjects,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.timetables.create,
				withSlug(
					ins1,
					createInput({
						programId: programs.me._id,
						classAlias: "missing-class",
						mathId: subjects.math._id,
						scienceId: subjects.appliedScience._id,
					}),
				),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});

	test("rejects subject from another institution", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.timetables.create,
				withSlug(
					ins1,
					createInput({
						programId: programs.me._id,
						classAlias: classes.class1.slug,
						mathId: subjects.math._id,
						scienceId: subjects.physics._id,
					}),
				),
			),
			ERROR_CODES.SUBJECT.NOT_FOUND,
		);
	});

	test("rejects conflicting whole-class slots", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.timetables.create,
				withSlug(ins1, {
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					changeMessage: "Conflict",
					slots: [
						{
							subjectId: subjects.math._id,
							day: 0,
							startHour: 0,
							endHour: 2,
						},
						{
							subjectId: subjects.appliedScience._id,
							day: 0,
							startHour: 1,
							endHour: 3,
						},
					],
				}),
			),
			ERROR_CODES.TIMETABLE.SLOT_CONFLICT,
		);
	});

	test("rejects invalid hour range", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.timetables.create,
				withSlug(ins1, {
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					changeMessage: "Invalid",
					slots: [
						{
							subjectId: subjects.math._id,
							day: 0,
							startHour: 6,
							endHour: 8,
						},
					],
				}),
			),
			ERROR_CODES.TIMETABLE.INVALID_SLOT,
		);
	});

	test("rejects batch that does not belong to the class", async ({
		t,
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const foreignBatchId = await t.run(async (ctx) => {
			return await ctx.db.insert("classBatches", {
				classId: classes.class2._id,
				numIdx: 1,
				createdAt: Date.now(),
			});
		});

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.timetables.create,
				withSlug(ins1, {
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					changeMessage: "Bad batch",
					slots: [
						{
							subjectId: subjects.math._id,
							batchId: foreignBatchId,
							day: 0,
							startHour: 0,
							endHour: 1,
						},
					],
				}),
			),
			ERROR_CODES.BATCH.NOT_FOUND,
		);
	});

	test("allows different batches to share the same hours", async ({
		t,
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const [batch1, batch2] = await t.run(async (ctx) => {
			const b1 = await ctx.db.insert("classBatches", {
				classId: classes.class1._id,
				numIdx: 1,
				createdAt: Date.now(),
			});
			const b2 = await ctx.db.insert("classBatches", {
				classId: classes.class1._id,
				numIdx: 2,
				createdAt: Date.now(),
			});
			return [b1, b2] as const;
		});

		const result = await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				changeMessage: "Lab batches",
				slots: [
					{
						subjectId: subjects.math._id,
						batchId: batch1,
						day: 0,
						startHour: 0,
						endHour: 3,
					},
					{
						subjectId: subjects.math._id,
						batchId: batch2,
						day: 0,
						startHour: 0,
						endHour: 3,
					},
				],
			}),
		);

		expect(result.slots).toHaveLength(2);
		expect(result.slots[0]?.batch?.name).toBe("B01");
		expect(result.slots[1]?.batch?.name).toBe("B02");
	});

	test("persists room on slots", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const result = await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				changeMessage: "With rooms",
				slots: [
					{
						subjectId: subjects.math._id,
						day: 0,
						startHour: 0,
						endHour: 1,
						room: "101",
					},
				],
			}),
		);

		expect(result.slots[0]).toMatchObject({
			day: 0,
			startHour: 0,
			endHour: 1,
			room: "101",
		});
	});
});

describe("timetables.get", () => {
	const test = timetableTest;

	test("returns latest version", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const authed = asOwner(user1, ins1);
		const base = createInput({
			programId: programs.me._id,
			classAlias: classes.class1.slug,
			mathId: subjects.math._id,
			scienceId: subjects.appliedScience._id,
		});

		await authed.mutation(api.timetables.create, withSlug(ins1, base));
		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...base,
				changeMessage: "Latest",
			}),
		);

		const latest = await authed.query(
			api.timetables.get,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
			}),
		);

		expect(latest.version).toBe(2);
		expect(latest.changeMessage).toBe("Latest");
	});

	test("throws when no timetable exists", async ({
		ins1,
		programs,
		classes,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.timetables.get,
				withSlug(ins1, {
					programId: programs.me._id,
					classAlias: classes.class1.slug,
				}),
			),
			ERROR_CODES.TIMETABLE.NOT_FOUND,
		);
	});
});

describe("timetables.getOrNull", () => {
	const test = timetableTest;

	test("returns null when no timetable exists", async ({
		ins1,
		programs,
		classes,
		asOwner,
		user1,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.timetables.getOrNull,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
			}),
		);

		expect(result).toBeNull();
	});

	test("returns latest timetable when one exists", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(
				ins1,
				createInput({
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
				}),
			),
		);

		const result = await asOwner(user1, ins1).query(
			api.timetables.getOrNull,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
			}),
		);

		expect(result?.version).toBe(1);
	});
});

describe("timetables.getByVersion", () => {
	const test = timetableTest;

	test("returns a specific version", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const authed = asOwner(user1, ins1);
		const base = createInput({
			programId: programs.me._id,
			classAlias: classes.class1.slug,
			mathId: subjects.math._id,
			scienceId: subjects.appliedScience._id,
		});

		await authed.mutation(api.timetables.create, withSlug(ins1, base));
		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...base,
				changeMessage: "Version two",
			}),
		);

		const v1 = await authed.query(
			api.timetables.getByVersion,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				version: 1,
			}),
		);

		expect(v1.version).toBe(1);
		expect(v1.changeMessage).toBe("Initial timetable");
	});

	test("throws when version is missing", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(
				ins1,
				createInput({
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
				}),
			),
		);

		await expectAppError(
			asOwner(user1, ins1).query(
				api.timetables.getByVersion,
				withSlug(ins1, {
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					version: 99,
				}),
			),
			ERROR_CODES.TIMETABLE.VERSION_NOT_FOUND,
		);
	});
});

describe("timetables.listVersions", () => {
	const test = timetableTest;

	test("returns versions newest first", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const authed = asOwner(user1, ins1);
		const base = createInput({
			programId: programs.me._id,
			classAlias: classes.class1.slug,
			mathId: subjects.math._id,
			scienceId: subjects.appliedScience._id,
		});

		await authed.mutation(api.timetables.create, withSlug(ins1, base));
		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...base,
				changeMessage: "Version two",
			}),
		);

		const versions = await authed.query(
			api.timetables.listVersions,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
			}),
		);

		expect(versions).toHaveLength(2);
		expect(versions[0]?.version).toBe(2);
		expect(versions[0]?.changeMessage).toBe("Version two");
		expect(versions[1]?.version).toBe(1);
		expect(versions[1]?.changeMessage).toBe("Initial timetable");
	});

	test("returns empty array when no timetable exists", async ({
		ins1,
		programs,
		classes,
		asOwner,
		user1,
	}) => {
		const versions = await asOwner(user1, ins1).query(
			api.timetables.listVersions,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
			}),
		);

		expect(versions).toEqual([]);
	});
});

describe("timetables.listByProgram", () => {
	const test = timetableTest;

	test("lists classes with and without timetables", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(
				ins1,
				createInput({
					programId: programs.me._id,
					classAlias: classes.class1.slug,
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
				}),
			),
		);

		const list = await asOwner(user1, ins1).query(
			api.timetables.listByProgram,
			withSlug(ins1, { programId: programs.me._id }),
		);

		const class1Entry = list.find(
			(item) => item.class._id === classes.class1._id,
		);
		const class2Entry = list.find(
			(item) => item.class._id === classes.class2._id,
		);

		expect(class1Entry?.timetable?.version).toBe(1);
		expect(class2Entry?.timetable).toBeNull();
	});

	test("rejects program from another institution", async ({
		ins1,
		programs,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.timetables.listByProgram,
				withSlug(ins1, { programId: programs.ce._id }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});
