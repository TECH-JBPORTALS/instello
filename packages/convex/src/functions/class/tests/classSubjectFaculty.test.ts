import { describe, expect } from "vitest";
import {
	classTest,
	expectAppError,
	ownerIdentity,
	seedFaculty,
	seedFacultyMember,
	seedSubjects,
	withSlug,
} from "#__fixtures__/index.setup";
import { api } from "#_generated/api";
import { ERROR_CODES } from "#helpers/constants";

const subjectFacultyTest = () =>
	classTest().extend(
		"subjects",
		async ({ t, ins1, ins2 }) =>
			await t.run((ctx) => seedSubjects(ctx, { ins1, ins2 })),
	);

describe("class.assignSubjectFaculty", () => {
	const test = subjectFacultyTest();

	test("rejects unauthenticated user", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await expectAppError(
			t.mutation(
				api.class.mutations.assignSubjectFaculty,
				withSlug(ins1, {
					classId: classes.class1._id,
					programSubjectId,
					facultyId,
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("assigns program faculty to a class subject", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		const assignmentId = await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		const row = await t.run((ctx) =>
			ctx.db.get("classSubjectFaculty", assignmentId),
		);

		expect(row).toMatchObject({
			classId: classes.class1._id,
			programSubjectId,
			facultyId,
		});
	});

	test("rejects faculty not on the program", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.class.mutations.assignSubjectFaculty,
				withSlug(ins1, {
					classId: classes.class1._id,
					programSubjectId,
					facultyId,
				}),
			),
			ERROR_CODES.CLASS_SUBJECT_FACULTY.NOT_PROGRAM_FACULTY,
		);
	});

	test("rejects subject from a different stage", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1SecondStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.class.mutations.assignSubjectFaculty,
				withSlug(ins1, {
					classId: classes.class1._id,
					programSubjectId,
					facultyId,
				}),
			),
			ERROR_CODES.CLASS_SUBJECT_FACULTY.INVALID_SUBJECT,
		);
	});

	test("allows multiple faculty on the same class subject", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);
		const otherFacultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: {
					email: "other.faculty@example.com",
					staffId: "STAFF-OTHER",
				},
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaffMany,
			withSlug(ins1, {
				programId: programs.me._id,
				facultyIds: [facultyId, otherFacultyId],
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);
		await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId: otherFacultyId,
			}),
		);

		const rows = await t.run((ctx) =>
			ctx.db
				.query("classSubjectFaculty")
				.withIndex("by_class_and_program_subject", (q) =>
					q
						.eq("classId", classes.class1._id)
						.eq("programSubjectId", programSubjectId),
				)
				.collect(),
		);

		expect(rows).toHaveLength(2);
	});

	test("is idempotent when already assigned", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		const first = await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);
		const second = await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		expect(second).toBe(first);
	});
});

describe("class.unassignSubjectFaculty", () => {
	const test = subjectFacultyTest();

	test("unassigns faculty from a class subject", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.class.mutations.unassignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		const rows = await t.run((ctx) =>
			ctx.db
				.query("classSubjectFaculty")
				.withIndex("by_class_and_program_subject", (q) =>
					q
						.eq("classId", classes.class1._id)
						.eq("programSubjectId", programSubjectId),
				)
				.collect(),
		);

		expect(rows).toHaveLength(0);
	});
});

describe("class.listSubjects", () => {
	const test = subjectFacultyTest();

	test("includes assigned faculty on list items", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: {
					firstName: "Ada",
					lastName: "Lovelace",
				},
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		const result = await asOwner(user1, ins1).query(
			api.class.queries.listSubjects,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			_id: programSubjectId,
			subject: {
				_id: subjects.math._id,
				alias: subjects.math.alias,
			},
			faculty: [
				{
					_id: facultyId,
					firstName: "Ada",
					lastName: "Lovelace",
				},
			],
		});
	});
});

describe("class.listFacultyForSubjectAssign", () => {
	const test = subjectFacultyTest();

	test("lists faculty assigned to the class program", async ({
		t,
		user1,
		ins1,
		programs,
		classes,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: {
					firstName: "Grace",
					lastName: "Hopper",
				},
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		const result = await asOwner(user1, ins1).query(
			api.class.queries.listFacultyForSubjectAssign,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			_id: facultyId,
			firstName: "Grace",
			lastName: "Hopper",
		});
	});
});

describe("class.listMyAssignedSubjects", () => {
	const test = subjectFacultyTest();

	test("groups assigned subjects by class for the current faculty", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const facultyUser = await t.run((ctx) =>
			seedFacultyMember(ctx, { institutionId: ins1._id }),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: {
					email: facultyUser.email,
					firstName: "Jane",
					lastName: "Doe",
					status: "active",
				},
			}),
		);

		await t.run(async (ctx) => {
			await ctx.db.patch("faculty", facultyId, {
				userId: facultyUser._id,
			});
		});

		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		const result = await t
			.withIdentity(ownerIdentity(facultyUser._id, ins1._id))
			.query(api.class.queries.listMyAssignedSubjects, withSlug(ins1, {}));

		expect(result).toMatchObject([
			{
				classId: classes.class1._id,
				className: classes.class1.name,
				classSlug: classes.class1.slug,
				programAlias: programs.me.alias,
				programName: programs.me.name,
				subjects: [
					{
						programSubjectId,
						name: subjects.math.name,
						alias: subjects.math.alias,
						type: "theory",
					},
				],
			},
		]);
	});
});

describe("class subject faculty cascades", () => {
	const test = subjectFacultyTest();

	test("removeSubject deletes class subject faculty assignments", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.mutations.removeSubject,
			withSlug(ins1, { id: programSubjectId }),
		);

		const rows = await t.run((ctx) =>
			ctx.db.query("classSubjectFaculty").collect(),
		);

		expect(rows).toHaveLength(0);
	});

	test("removeStaff deletes that faculty's class subject assignments", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		subjects,
		classes,
		asOwner,
	}) => {
		const [programSubjectId] = await asOwner(user1, ins1).mutation(
			api.program.mutations.allocateSubjects,
			withSlug(ins1, {
				programId: programs.me._id,
				academicStageId: academicAdoptions.ins1FirstStage._id,
				subjectIds: [subjects.math._id],
				type: "theory",
			}),
		);

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const programFacultyId = await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, { programId: programs.me._id, facultyId }),
		);

		await asOwner(user1, ins1).mutation(
			api.class.mutations.assignSubjectFaculty,
			withSlug(ins1, {
				classId: classes.class1._id,
				programSubjectId,
				facultyId,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.removeStaff,
			withSlug(ins1, { programFacultyId }),
		);

		const rows = await t.run((ctx) =>
			ctx.db
				.query("classSubjectFaculty")
				.withIndex("by_faculty", (q) => q.eq("facultyId", facultyId))
				.collect(),
		);

		expect(rows).toHaveLength(0);
	});
});
