import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	expectAppError,
	programSubjectTest,
	withSlug,
} from "./fixtures/index.setup";

describe("programSubjects.allocate", () => {
	const test = programSubjectTest();

	test("rejects unauthenticated user", async ({
		t,
		ins1,
		programs,
		academicAdoptions,
		subjects,
	}) => {
		await expectAppError(
			t.mutation(
				api.programSubjects.allocate,
				withSlug(ins1, {
					programId: programs.me._id,
					academicStageId: academicAdoptions.ins1FirstStage._id,
					subjectIds: [subjects.math._id],
					type: "theory",
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("allocates subjects with the given type", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		const insertedIds = await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id, subjects.appliedScience._id],
				type: "theory",
			}),
		);

		expect(insertedIds).toHaveLength(2);

		const rows = await t.run((ctx) =>
			ctx.db.query("programSubjects").collect(),
		);

		expect(rows).toHaveLength(2);
		expect(rows).toMatchObject([
			{
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectId: subjects.math._id,
				type: "theory",
			},
			{
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectId: subjects.appliedScience._id,
				type: "theory",
			},
		]);
	});

	test("allocates the remaining type for a subject already allocated with another type", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const secondBatchIds = await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id, subjects.appliedScience._id],
				type: "practical",
			}),
		);

		expect(secondBatchIds).toHaveLength(2);

		const rows = await t.run((ctx) =>
			ctx.db.query("programSubjects").collect(),
		);

		expect(rows).toHaveLength(3);
		expect(rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					subjectId: subjects.math._id,
					type: "theory",
				}),
				expect.objectContaining({
					subjectId: subjects.math._id,
					type: "practical",
				}),
				expect.objectContaining({
					subjectId: subjects.appliedScience._id,
					type: "practical",
				}),
			]),
		);
	});

	test("skips subjects already allocated with the same type", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const secondBatchIds = await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id, subjects.appliedScience._id],
				type: "theory",
			}),
		);

		expect(secondBatchIds).toHaveLength(1);

		const rows = await t.run((ctx) =>
			ctx.db.query("programSubjects").collect(),
		);

		expect(rows).toHaveLength(2);
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programSubjects.allocate,
				withSlug(ins1, {
					programId: programs.ce._id,
					academicStageId: academicAdoptions.ins1FirstStage._id,
					subjectIds: [subjects.math._id],
					type: "theory",
				}),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});

	test("rejects stage from another institution's pattern", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programSubjects.allocate,
				withSlug(ins1, {
					programId: programs.me._id,
					academicStageId: academicAdoptions.ins2FirstStage._id,
					subjectIds: [subjects.math._id],
					type: "theory",
				}),
			),
			ERROR_CODES.PROGRAM_SUBJECT.INVALID_STAGE,
		);
	});

	test("rejects when institution has no adopted pattern", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await t.run(async (ctx) => {
			const adoption = await ctx.db
				.query("institutionAcademicPatterns")
				.withIndex("by_institution", (q) => q.eq("institutionId", ins1._id))
				.first();
			if (adoption) {
				await ctx.db.delete("institutionAcademicPatterns", adoption._id);
			}
		});

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programSubjects.allocate,
				withSlug(ins1, {
					programId: programs.me._id,
					academicStageId: academicAdoptions.ins1FirstStage._id,
					subjectIds: [subjects.math._id],
					type: "theory",
				}),
			),
			ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.NOT_FOUND,
		);
	});
});

describe("programSubjects.listByStage", () => {
	const test = programSubjectTest();

	test("rejects unauthenticated user", async ({
		t,
		ins1,
		programs,
		academicAdoptions,
	}) => {
		await expectAppError(
			t.query(
				api.programSubjects.listByStage,
				withSlug(ins1, {
					programId: programs.me._id,
					academicStageId: academicAdoptions.ins1FirstStage._id,
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists allocated subjects joined with subject details, ordered by name", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.appliedScience._id, subjects.math._id],
				type: "practical",
			}),
		);

		const result = await asOwner(user1, ins1).query(
			api.programSubjects.listByStage,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
			}),
		);

		expect(result).toHaveLength(2);
		expect(result).toMatchObject([
			{
				type: "practical",
				subject: {
					_id: subjects.appliedScience._id,
					name: subjects.appliedScience.name,
					code: subjects.appliedScience.code,
				},
			},
			{
				type: "practical",
				subject: {
					_id: subjects.math._id,
					name: subjects.math.name,
					code: subjects.math.code,
				},
			},
		]);
	});

	test("does not include allocations from a different stage", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const result = await asOwner(user1, ins1).query(
			api.programSubjects.listByStage,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1SecondStage._id,
			}),
		);

		expect(result).toHaveLength(0);
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.programSubjects.listByStage,
				withSlug(ins1, {
					programId: programs.ce._id,
					academicStageId: academicAdoptions.ins1FirstStage._id,
				}),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("programSubjects.listAllocatable", () => {
	const test = programSubjectTest();

	test("rejects unauthenticated user", async ({
		t,
		ins1,
		programs,
		academicAdoptions,
	}) => {
		await expectAppError(
			t.query(
				api.programSubjects.listAllocatable,
				withSlug(ins1, {
					programId: programs.me._id,
					academicStageId: academicAdoptions.ins1FirstStage._id,
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("returns remaining types for unallocated and partially allocated subjects", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const result = await asOwner(user1, ins1).query(
			api.programSubjects.listAllocatable,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
			}),
		);

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					_id: subjects.math._id,
					remainingTypes: ["practical"],
				}),
				expect.objectContaining({
					_id: subjects.appliedScience._id,
					remainingTypes: ["theory", "practical"],
				}),
			]),
		);
		expect(result).toHaveLength(2);
	});

	test("excludes subjects that have all types allocated", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);
		await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "practical",
			}),
		);

		const result = await asOwner(user1, ins1).query(
			api.programSubjects.listAllocatable,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
			}),
		);

		expect(result).toMatchObject([
			{
				_id: subjects.appliedScience._id,
				name: subjects.appliedScience.name,
				remainingTypes: ["theory", "practical"],
			},
		]);
	});

	test("rejects stage from another institution's pattern", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.programSubjects.listAllocatable,
				withSlug(ins1, {
					programId: programs.me._id,
					academicStageId: academicAdoptions.ins2FirstStage._id,
				}),
			),
			ERROR_CODES.PROGRAM_SUBJECT.INVALID_STAGE,
		);
	});
});

describe("programSubjects.remove", () => {
	const test = programSubjectTest();

	test("rejects unauthenticated user", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		const [id] = await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		await expectAppError(
			t.mutation(api.programSubjects.remove, withSlug(ins1, { id })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("removes an allocation", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		const [id] = await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		if (!id) throw new Error("Expected an allocation id");

		await asOwner(user1, ins1).mutation(
			api.programSubjects.remove,
			withSlug(ins1, { id }),
		);

		const rows = await t.run((ctx) =>
			ctx.db.query("programSubjects").collect(),
		);

		expect(rows).toHaveLength(0);
	});

	test("throws error if the allocation doesn't exist", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		const [id] = await asOwner(user1, ins1).mutation(
			api.programSubjects.allocate,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		if (!id) throw new Error("Expected an allocation id");

		await t.run((ctx) => ctx.db.delete("programSubjects", id));

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programSubjects.remove,
				withSlug(ins1, { id }),
			),
			ERROR_CODES.PROGRAM_SUBJECT.NOT_FOUND,
		);
	});

	test("rejects allocation belonging to another institution's program", async ({
		user1,
		user2,
		ins1,
		ins2,
		programs,
		academicAdoptions,
		subjects,
		asOwner,
	}) => {
		const [id] = await asOwner(user2, ins2).mutation(
			api.programSubjects.allocate,
			withSlug(ins2, {
				programId: programs.ce._id,
				academicStageId: academicAdoptions.ins2FirstStage._id,
				subjectIds: [subjects.physics._id],
				type: "theory",
			}),
		);

		if (!id) throw new Error("Expected an allocation id");

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.programSubjects.remove,
				withSlug(ins1, { id }),
			),
			ERROR_CODES.PROGRAM_SUBJECT.NOT_FOUND,
		);
	});
});
