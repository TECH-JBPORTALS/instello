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

describe("classes.enableSectionGroups", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.classes.enableSectionGroups,
				withSlug(ins1, { id: classes.class1._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("creates two empty batches when class has no students", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		const result = await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		expect(result).toMatchObject({
			_id: classes.class1._id,
			isGroupsEnabled: true,
		});

		const batches = await authed.query(
			api.classBatches.list,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(batches).toHaveLength(2);
		expect(batches.map((b) => b.label)).toEqual(["B01", "B02"]);

		const cls = await authed.query(
			api.classes.getById,
			withSlug(ins1, { id: classes.class1._id }),
		);
		expect(cls.isGroupsEnabled).toBe(true);
		expect(cls.batchNamingConvention).toBe("numeric");
	});

	test("splits existing students evenly between two batches", async ({
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

		for (let i = 0; i < 3; i++) {
			await authed.mutation(
				api.students.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						usn: `1MS21CS00${i}`,
						email: `student${i}@example.com`,
					}),
				),
			);
		}

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const students = await authed.query(
			api.students.list,
			withSlug(ins1, {
				classId: classes.class1._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(students.page).toHaveLength(3);
		const batchLabels = students.page.map((s) => s.batchLabel);
		expect(batchLabels.every((label) => label !== undefined)).toBe(true);

		const batch1Count = batchLabels.filter((l) => l === "B01").length;
		const batch2Count = batchLabels.filter((l) => l === "B02").length;
		expect(batch1Count).toBe(2);
		expect(batch2Count).toBe(1);
	});

	test("rejects when already enabled", async ({
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

		await expectAppError(
			authed.mutation(
				api.classes.enableSectionGroups,
				withSlug(ins1, { id: classes.class1._id }),
			),
			ERROR_CODES.CLASS.BATCHES_ALREADY_ENABLED,
		);
	});

	test("rejects class from another institution", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.classes.enableSectionGroups,
				withSlug(ins1, { id: classes.class3._id }),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});
});

describe("classes.disableSectionGroups", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.classes.disableSectionGroups,
				withSlug(ins1, { id: classes.class1._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("rejects when not enabled", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.classes.disableSectionGroups,
				withSlug(ins1, { id: classes.class1._id }),
			),
			ERROR_CODES.CLASS.BATCHES_NOT_ENABLED,
		);
	});

	test("deletes batches and assignments but keeps students", async ({
		t,
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

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await authed.mutation(
			api.classes.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const result = await authed.mutation(
			api.classes.disableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		expect(result).toMatchObject({
			_id: classes.class1._id,
			isGroupsEnabled: false,
		});

		const remainingBatches = await t.run(async (ctx) => {
			return await ctx.db
				.query("classBatches")
				.withIndex("by_class", (q) => q.eq("classId", classes.class1._id))
				.collect();
		});
		expect(remainingBatches).toHaveLength(0);

		const classStudents = await t.run(async (ctx) => {
			return await ctx.db
				.query("students")
				.withIndex("by_class", (q) => q.eq("classId", classes.class1._id))
				.collect();
		});
		expect(classStudents.every((s) => s.batchId === undefined)).toBe(true);

		const student = await authed.query(
			api.students.getById,
			withSlug(ins1, { id: studentId }),
		);
		expect(student).toBeTruthy();
		expect(student.batchId).toBeUndefined();
		expect(student.batchLabel).toBeUndefined();
	});
});

describe("classBatches.updateNamingConvention", () => {
	test("relabels batches to alphabetic convention", async ({
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
			api.classBatches.updateNamingConvention,
			withSlug(ins1, {
				classId: classes.class1._id,
				namingConvention: "alphabetic",
			}),
		);

		const batches = await authed.query(
			api.classBatches.list,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(batches.map((b) => b.label)).toEqual(["A", "B"]);
	});

	test("rejects when batches not enabled", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.classBatches.updateNamingConvention,
				withSlug(ins1, {
					classId: classes.class1._id,
					namingConvention: "alphabetic",
				}),
			),
			ERROR_CODES.CLASS.BATCHES_NOT_ENABLED,
		);
	});
});

describe("students.create with batches", () => {
	test("auto-assigns to least-populated batch when omitted", async ({
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

		const batches = await authed.query(
			api.classBatches.list,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		const student = await authed.query(
			api.students.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(batches.some((b) => b._id === student.batchId)).toBe(true);
	});

	test("assigns to the explicitly selected batch", async ({
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

		const batches = await authed.query(
			api.classBatches.list,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		const targetBatch = batches[1];

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					batchId: targetBatch._id,
				}),
			),
		);

		const student = await authed.query(
			api.students.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.batchId).toBe(targetBatch._id);
		expect(student.batchLabel).toBe(targetBatch.label);
	});

	test("rejects a batch from another class", async ({
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

		const otherClassBatches = await authed.query(
			api.classBatches.list,
			withSlug(ins1, { classId: classes.class2._id }),
		);

		await expectAppError(
			authed.mutation(
				api.students.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						batchId: otherClassBatches[0]._id,
					}),
				),
			),
			ERROR_CODES.BATCH.NOT_FOUND,
		);
	});

	test("rejects a batchId when batches are not enabled", async ({
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
			withSlug(ins1, { id: classes.class2._id }),
		);
		const otherClassBatches = await authed.query(
			api.classBatches.list,
			withSlug(ins1, { classId: classes.class2._id }),
		);

		await expectAppError(
			authed.mutation(
				api.students.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						batchId: otherClassBatches[0]._id,
					}),
				),
			),
			ERROR_CODES.CLASS.BATCHES_NOT_ENABLED,
		);
	});
});
