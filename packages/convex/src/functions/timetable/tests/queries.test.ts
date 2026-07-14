import { describe, expect } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { ERROR_CODES } from "../../helpers/constants";
import {
	classTest,
	expectAppError,
	seedSubjects,
	withSlug,
} from "../../tests/fixtures/index.setup";

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
describe("timetable.queries.get", () => {
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

		await authed.mutation(api.timetable.mutations.create, withSlug(ins1, base));
		await authed.mutation(
			api.timetable.mutations.create,
			withSlug(ins1, {
				...base,
				changeMessage: "Latest",
			}),
		);

		const latest = await authed.query(
			api.timetable.queries.get,
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
				api.timetable.queries.get,
				withSlug(ins1, {
					programId: programs.me._id,
					classAlias: classes.class1.slug,
				}),
			),
			ERROR_CODES.TIMETABLE.NOT_FOUND,
		);
	});
});

describe("timetable.queries.getOrNull", () => {
	const test = timetableTest;

	test("returns null when no timetable exists", async ({
		ins1,
		programs,
		classes,
		asOwner,
		user1,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.timetable.queries.getOrNull,
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
			api.timetable.mutations.create,
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
			api.timetable.queries.getOrNull,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
			}),
		);

		expect(result?.version).toBe(1);
	});
});

describe("timetable.queries.getByVersion", () => {
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

		await authed.mutation(api.timetable.mutations.create, withSlug(ins1, base));
		await authed.mutation(
			api.timetable.mutations.create,
			withSlug(ins1, {
				...base,
				changeMessage: "Version two",
			}),
		);

		const v1 = await authed.query(
			api.timetable.queries.getByVersion,
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
			api.timetable.mutations.create,
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
				api.timetable.queries.getByVersion,
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

describe("timetable.queries.listVersions", () => {
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

		await authed.mutation(api.timetable.mutations.create, withSlug(ins1, base));
		await authed.mutation(
			api.timetable.mutations.create,
			withSlug(ins1, {
				...base,
				changeMessage: "Version two",
			}),
		);

		const versions = await authed.query(
			api.timetable.queries.listVersions,
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
			api.timetable.queries.listVersions,
			withSlug(ins1, {
				programId: programs.me._id,
				classAlias: classes.class1.slug,
			}),
		);

		expect(versions).toEqual([]);
	});
});

describe("timetable.queries.listByProgram", () => {
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
			api.timetable.mutations.create,
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
			api.timetable.queries.listByProgram,
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

	test("includes each class's academic stage, ordered by sequence", async ({
		ins1,
		programs,
		classes,
		academicAdoptions,
		asOwner,
		user1,
	}) => {
		const list = await asOwner(user1, ins1).query(
			api.timetable.queries.listByProgram,
			withSlug(ins1, { programId: programs.me._id }),
		);

		const class1Entry = list.find(
			(item) => item.class._id === classes.class1._id,
		);
		const class2Entry = list.find(
			(item) => item.class._id === classes.class2._id,
		);

		expect(class1Entry?.class.stage._id).toBe(
			academicAdoptions.ins1FirstStage._id,
		);
		expect(class2Entry?.class.stage._id).toBe(
			academicAdoptions.ins1SecondStage._id,
		);

		const class1Index = list.findIndex(
			(item) => item.class._id === classes.class1._id,
		);
		const class2Index = list.findIndex(
			(item) => item.class._id === classes.class2._id,
		);
		expect(class1Index).toBeLessThan(class2Index);
	});

	test("rejects program from another institution", async ({
		ins1,
		programs,
		asOwner,
		user1,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.timetable.queries.listByProgram,
				withSlug(ins1, { programId: programs.ce._id }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});
