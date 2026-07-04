import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	classTest,
	createStudentInput,
	expectAppError,
	withSlug,
} from "./fixtures/index.setup";

const test = classTest();

describe("classBatches.listMoveTargets", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.query(
				api.classBatches.listMoveTargets,
				withSlug(ins1, { classId: classes.class1._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("excludes the current class itself when it has no batches enabled", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		const targets = await authed.query(
			api.classBatches.listMoveTargets,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(
			targets.some((target) => target.classId === classes.class1._id),
		).toBe(false);
	});

	test("lists a batch-enabled sibling class as targets when the current class has no batches enabled", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const targets = await authed.query(
			api.classBatches.listMoveTargets,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		const siblingTargets = targets.filter(
			(target) => target.classId === classes.class2._id,
		);

		expect(siblingTargets).toHaveLength(2);
		expect(siblingTargets.every((target) => !target.isCurrentClass)).toBe(true);
		expect(siblingTargets.every((target) => target.batchId !== undefined)).toBe(
			true,
		);
	});

	test("lists the current class's own batches without a class prefix", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const targets = await authed.query(
			api.classBatches.listMoveTargets,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		const ownBatchTargets = targets.filter(
			(target) => target.classId === classes.class1._id,
		);

		expect(ownBatchTargets).toHaveLength(2);
		expect(ownBatchTargets.every((target) => target.isCurrentClass)).toBe(true);
		expect(ownBatchTargets.map((target) => target.batchLabel)).toEqual([
			"B01",
			"B02",
		]);
	});

	test("lists a batch-enabled sibling class as class + batch pairs", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);
		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const targets = await authed.query(
			api.classBatches.listMoveTargets,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		const siblingTargets = targets.filter(
			(target) => target.classId === classes.class2._id,
		);

		expect(siblingTargets).toHaveLength(2);
		expect(siblingTargets.every((target) => !target.isCurrentClass)).toBe(true);
		expect(
			siblingTargets.every((target) => target.className === "Class 2"),
		).toBe(true);
		expect(siblingTargets.every((target) => target.batchId !== undefined)).toBe(
			true,
		);
	});

	test("lists a non-batch sibling class as a single bare-class target", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const targets = await authed.query(
			api.classBatches.listMoveTargets,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		const siblingTargets = targets.filter(
			(target) => target.classId === classes.class2._id,
		);

		expect(siblingTargets).toEqual([
			{
				classId: classes.class2._id,
				className: "Class 2",
				batchId: undefined,
				batchLabel: undefined,
				isCurrentClass: false,
			},
		]);
	});

	test("excludes classes from another institution's program", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const targets = await authed.query(
			api.classBatches.listMoveTargets,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(
			targets.some((target) => target.classId === classes.class3._id),
		).toBe(false);
	});
});

describe("classBatches.splitIntoNewBatch", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.classBatches.splitIntoNewBatch,
				withSlug(ins1, { classId: classes.class1._id, studentIds: [] }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("rejects when batches are not enabled", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.classBatches.splitIntoNewBatch,
				withSlug(ins1, { classId: classes.class1._id, studentIds: [] }),
			),
			ERROR_CODES.CLASS.BATCHES_NOT_ENABLED,
		);
	});

	test("creates the next-numbered batch and moves the given students into it", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const studentIds = [];
		for (let i = 0; i < 2; i++) {
			const studentId = await authed.mutation(
				api.students.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						usn: `1MS21CS10${i}`,
						email: `split-student${i}@example.com`,
					}),
				),
			);
			studentIds.push(studentId);
		}

		const newBatch = await authed.mutation(
			api.classBatches.splitIntoNewBatch,
			withSlug(ins1, { classId: classes.class1._id, studentIds }),
		);

		expect(newBatch.numIdx).toBe(3);
		expect(newBatch.label).toBe("B03");

		for (const studentId of studentIds) {
			const student = await authed.query(
				api.students.getById,
				withSlug(ins1, { id: studentId }),
			);
			expect(student.batchId).toBe(newBatch._id);
			expect(student.batchLabel).toBe("B03");
		}
	});

	test("rejects a student that doesn't belong to the class", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const otherClassStudentId = await authed.mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class2._id, categories[0]._id, {
					usn: "1MS21CS200",
					email: "other-class-student@example.com",
				}),
			),
		);

		await expectAppError(
			authed.mutation(
				api.classBatches.splitIntoNewBatch,
				withSlug(ins1, {
					classId: classes.class1._id,
					studentIds: [otherClassStudentId],
				}),
			),
			ERROR_CODES.STUDENT.NOT_FOUND,
		);
	});
});

describe("students.bulkMove", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.students.bulkMove,
				withSlug(ins1, {
					studentIds: [],
					targetClassId: classes.class2._id,
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("moves a student into a batch of another class", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);
		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS300",
					email: "move-student@example.com",
				}),
			),
		);

		const targetBatches = await authed.query(
			api.classBatches.list,
			withSlug(ins1, { classId: classes.class2._id }),
		);
		const targetBatch = targetBatches[0];

		await authed.mutation(
			api.students.bulkMove,
			withSlug(ins1, {
				studentIds: [studentId],
				targetClassId: classes.class2._id,
				targetBatchId: targetBatch._id,
			}),
		);

		const student = await authed.query(
			api.students.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.classId).toBe(classes.class2._id);
		expect(student.batchId).toBe(targetBatch._id);
		expect(student.batchLabel).toBe(targetBatch.label);
	});

	test("moves a student into a class without batches and clears batchId", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS301",
					email: "move-student2@example.com",
				}),
			),
		);

		await authed.mutation(
			api.students.bulkMove,
			withSlug(ins1, {
				studentIds: [studentId],
				targetClassId: classes.class2._id,
			}),
		);

		const student = await authed.query(
			api.students.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.classId).toBe(classes.class2._id);
		expect(student.batchId).toBeUndefined();
		expect(student.batchLabel).toBeUndefined();
	});

	test("rejects moving into a batch-enabled class without a targetBatchId", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);
		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS302",
					email: "move-student3@example.com",
				}),
			),
		);

		await expectAppError(
			authed.mutation(
				api.students.bulkMove,
				withSlug(ins1, {
					studentIds: [studentId],
					targetClassId: classes.class2._id,
				}),
			),
			ERROR_CODES.CLASS.BATCH_REQUIRED,
		);
	});

	test("rejects an unknown student", async ({
		user1,
		ins1,
		classes,
		asOwner,
		t,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS303",
					email: "move-student4@example.com",
				}),
			),
		);

		await t.run(async (ctx) => {
			await ctx.db.delete("students", studentId);
		});

		await expectAppError(
			authed.mutation(
				api.students.bulkMove,
				withSlug(ins1, {
					studentIds: [studentId],
					targetClassId: classes.class2._id,
				}),
			),
			ERROR_CODES.STUDENT.NOT_FOUND,
		);
	});
});
