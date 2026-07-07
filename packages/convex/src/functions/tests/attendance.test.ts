import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	ATTENDANCE_GRACE_PERIOD_MS,
	sessionDateFromNow,
	sessionDateToDayStartMs,
	sessionWindowMs,
	weekdayFromSessionDate,
} from "../helpers/academicSchedule";
import { ERROR_CODES } from "../helpers/constants";
import { computeSessionStatus } from "../model/attendanceSession";
import {
	classTest,
	createStudentInput,
	expectAppError,
	seedSubjects,
	withSlug,
} from "./fixtures/index.setup";

const attendanceTest = classTest().extend(
	"subjects",
	async ({ t, ins1, ins2 }) =>
		await t.run((ctx) => seedSubjects(ctx, { ins1, ins2 })),
);

const TIMEZONE_OFFSET = 0;
const FIXED_SESSION_DATE = "2026-07-06";

function testSessionContext() {
	const sessionDate = sessionDateFromNow(Date.now(), TIMEZONE_OFFSET);
	const day = weekdayFromSessionDate(sessionDate, TIMEZONE_OFFSET);
	const { sessionStartMs } = sessionWindowMs({
		sessionDate,
		startHour: 0,
		endHour: 1,
		timezoneOffsetMinutes: TIMEZONE_OFFSET,
	});
	return {
		sessionDate,
		day,
		now: sessionStartMs + 15 * 60 * 1000,
		timezoneOffsetMinutes: TIMEZONE_OFFSET,
	};
}

function createSlots(args: {
	mathId: Id<"subjects">;
	scienceId: Id<"subjects">;
	day: number;
	batchId?: Id<"classBatches">;
}) {
	return [
		{
			subjectId: args.mathId,
			day: args.day,
			startHour: 0,
			endHour: 1,
		},
		{
			subjectId: args.scienceId,
			day: args.day,
			startHour: 1,
			endHour: 2,
		},
		{
			subjectId: args.mathId,
			day: (args.day + 1) % 6,
			startHour: 0,
			endHour: 2,
			...(args.batchId ? { batchId: args.batchId } : {}),
		},
	];
}

describe("attendance register sync", () => {
	const test = attendanceTest;

	test("creates registers for unique subject and batch combos", async ({
		t,
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.timetables.create,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				changeMessage: "Initial timetable",
				slots: createSlots({
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
					day: 0,
				}),
			}),
		);

		const registers = await t.run((ctx) =>
			ctx.db.query("attendanceRegisters").collect(),
		);

		expect(registers).toHaveLength(2);
		expect(registers.map((register) => register.subjectId).sort()).toEqual(
			[subjects.appliedScience._id, subjects.math._id].sort(),
		);
	});

	test("archives register when subject is removed in a new timetable version", async ({
		t,
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const authed = asOwner(user1, ins1);
		const base = {
			programId: programs.me._id,
			classAlias: classes.class1.slug,
		};

		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...base,
				changeMessage: "v1",
				slots: createSlots({
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
					day: 0,
				}),
			}),
		);

		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...base,
				changeMessage: "v2",
				slots: [
					{
						subjectId: subjects.math._id,
						day: 0,
						startHour: 0,
						endHour: 1,
					},
				],
			}),
		);

		const registers = await t.run((ctx) =>
			ctx.db.query("attendanceRegisters").collect(),
		);

		const scienceRegister = registers.find(
			(register) => register.subjectId === subjects.appliedScience._id,
		);
		expect(scienceRegister?.status).toBe("archived");
	});
});

describe("attendance.listSessions", () => {
	const test = attendanceTest;

	test("returns today's sessions from the effective timetable", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const session = testSessionContext();
		const authed = asOwner(user1, ins1);
		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				changeMessage: "Initial timetable",
				slots: createSlots({
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
					day: session.day,
				}),
			}),
		);

		const registers = await authed.query(
			api.attendance.listRegisters,
			withSlug(ins1, {
				programId: programs.me._id,
				classSlug: classes.class1.slug,
			}),
		);

		const mathRegister = registers.find(
			(register) => register.subjectId === subjects.math._id,
		);
		expect(mathRegister).toBeDefined();

		const groups = await authed.query(
			api.attendance.listSessions,
			withSlug(ins1, {
				// biome-ignore lint/style/noNonNullAssertion: mathRegister is guaranteed to be defined
				registerId: mathRegister!._id,
				now: session.now,
				timezoneOffsetMinutes: session.timezoneOffsetMinutes,
				daysBack: 0,
			}),
		);

		const todayGroup = groups.find((group) => group.label === "Today");
		expect(todayGroup?.sessions).toHaveLength(1);
		expect(todayGroup?.sessions[0]).toMatchObject({
			day: session.day,
			startHour: 0,
			endHour: 1,
			status: "ongoing",
		});
	});
});

describe("attendance.mark", () => {
	const test = attendanceTest;

	test("stores attendance with markedBy and student entries", async ({
		t,
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const session = testSessionContext();
		const authed = asOwner(user1, ins1);
		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				changeMessage: "Initial timetable",
				slots: createSlots({
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
					day: session.day,
				}),
			}),
		);

		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		const registers = await authed.query(
			api.attendance.listRegisters,
			withSlug(ins1, {
				programId: programs.me._id,
				classSlug: classes.class1.slug,
			}),
		);
		// biome-ignore lint/style/noNonNullAssertion: <math register is guaranteed to be defined>
		const mathRegister = registers.find(
			(register) => register.subjectId === subjects.math._id,
		)!;

		const result = await authed.mutation(
			api.attendance.mark,
			withSlug(ins1, {
				registerId: mathRegister._id,
				sessionDate: session.sessionDate,
				day: session.day,
				startHour: 0,
				endHour: 1,
				now: session.now,
				timezoneOffsetMinutes: session.timezoneOffsetMinutes,
				entries: [{ studentId, status: "present" }],
			}),
		);

		expect(result.status).toBe("completed");
		expect(result.stats).toBe("1/1 (100%)");

		const records = await t.run((ctx) =>
			ctx.db.query("attendanceRecords").collect(),
		);
		expect(records[0]?.markedBy).toBe(user1._id);

		const entries = await t.run((ctx) =>
			ctx.db.query("attendanceEntries").collect(),
		);
		expect(entries).toMatchObject([{ studentId, status: "present" }]);
	});

	test("rejects marking an archived register", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const session = testSessionContext();
		const authed = asOwner(user1, ins1);
		const base = {
			programId: programs.me._id,
			classAlias: classes.class1.slug,
		};

		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...base,
				changeMessage: "v1",
				slots: createSlots({
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
					day: session.day,
				}),
			}),
		);

		const registersV1 = await authed.query(
			api.attendance.listRegisters,
			withSlug(ins1, {
				programId: programs.me._id,
				classSlug: classes.class1.slug,
			}),
		);
		// biome-ignore lint/style/noNonNullAssertion: <science register is guaranteed to be defined>
		const scienceRegister = registersV1.find(
			(register) => register.subjectId === subjects.appliedScience._id,
		)!;

		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				...base,
				changeMessage: "v2",
				slots: [
					{
						subjectId: subjects.math._id,
						day: session.day,
						startHour: 0,
						endHour: 1,
					},
				],
			}),
		);

		await expectAppError(
			authed.mutation(
				api.attendance.mark,
				withSlug(ins1, {
					registerId: scienceRegister._id,
					sessionDate: session.sessionDate,
					day: session.day,
					startHour: 1,
					endHour: 2,
					now: session.now,
					timezoneOffsetMinutes: session.timezoneOffsetMinutes,
					entries: [],
				}),
			),
			ERROR_CODES.ATTENDANCE.REGISTER_ARCHIVED,
		);
	});

	test("rejects marking after the grace window", async ({
		ins1,
		programs,
		classes,
		subjects,
		asOwner,
		user1,
	}) => {
		const session = testSessionContext();
		const authed = asOwner(user1, ins1);
		await authed.mutation(
			api.timetables.create,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
				changeMessage: "Initial timetable",
				slots: createSlots({
					mathId: subjects.math._id,
					scienceId: subjects.appliedScience._id,
					day: session.day,
				}),
			}),
		);

		const registers = await authed.query(
			api.attendance.listRegisters,
			withSlug(ins1, {
				programId: programs.me._id,
				classSlug: classes.class1.slug,
			}),
		);
		// biome-ignore lint/style/noNonNullAssertion: <Math register is guaranteed to be defined>
		const mathRegister = registers.find(
			(register) => register.subjectId === subjects.math._id,
		)!;

		const { sessionEndMs } = sessionWindowMs({
			sessionDate: session.sessionDate,
			startHour: 0,
			endHour: 1,
			timezoneOffsetMinutes: session.timezoneOffsetMinutes,
		});
		const now = sessionEndMs + ATTENDANCE_GRACE_PERIOD_MS + 1;

		await expectAppError(
			authed.mutation(
				api.attendance.mark,
				withSlug(ins1, {
					registerId: mathRegister._id,
					sessionDate: session.sessionDate,
					day: session.day,
					startHour: 0,
					endHour: 1,
					now,
					timezoneOffsetMinutes: session.timezoneOffsetMinutes,
					entries: [],
				}),
			),
			ERROR_CODES.ATTENDANCE.SESSION_NOT_MARKABLE,
		);
	});
});

describe("computeSessionStatus", () => {
	it("returns upcoming before session start", () => {
		const { sessionStartMs } = sessionWindowMs({
			sessionDate: FIXED_SESSION_DATE,
			startHour: 0,
			endHour: 1,
			timezoneOffsetMinutes: TIMEZONE_OFFSET,
		});

		expect(
			computeSessionStatus({
				now: sessionStartMs - 1,
				sessionDate: FIXED_SESSION_DATE,
				startHour: 0,
				endHour: 1,
				timezoneOffsetMinutes: TIMEZONE_OFFSET,
				hasRecord: false,
			}).status,
		).toBe("upcoming");
	});

	it("returns missed after grace period", () => {
		const { sessionEndMs } = sessionWindowMs({
			sessionDate: FIXED_SESSION_DATE,
			startHour: 0,
			endHour: 1,
			timezoneOffsetMinutes: TIMEZONE_OFFSET,
		});

		expect(
			computeSessionStatus({
				now: sessionEndMs + ATTENDANCE_GRACE_PERIOD_MS,
				sessionDate: FIXED_SESSION_DATE,
				startHour: 0,
				endHour: 1,
				timezoneOffsetMinutes: TIMEZONE_OFFSET,
				hasRecord: false,
			}).status,
		).toBe("missed");
	});
});

describe("sessionDateToDayStartMs", () => {
	it("round-trips YYYY-MM-DD with UTC offset", () => {
		const dayStart = sessionDateToDayStartMs(
			FIXED_SESSION_DATE,
			TIMEZONE_OFFSET,
		);
		expect(dayStart).toBe(Date.UTC(2026, 6, 6));
	});
});
