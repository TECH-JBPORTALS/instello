import { describe, expect, vi } from "vitest";
import {
	classTest,
	createStudentInput,
	expectAppError,
	withSlug,
} from "../../__fixtures__/index.setup";
import { api } from "../../_generated/api";
import { ERROR_CODES } from "../../helpers/constants";

const test = classTest();

describe("classes.enableSectionGroups", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.class.mutations.enableSectionGroups,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		expect(result).toMatchObject({
			_id: classes.class1._id,
			isGroupsEnabled: true,
		});

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(batches).toHaveLength(2);
		expect(batches.map((b) => b.label)).toEqual(["B01", "B02"]);

		const cls = await authed.query(
			api.class.queries.getById,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		for (let i = 0; i < 3; i++) {
			await authed.mutation(
				api.student.mutations.create,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const students = await authed.query(
			api.student.queries.list,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		await expectAppError(
			authed.mutation(
				api.class.mutations.enableSectionGroups,
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
				api.class.mutations.enableSectionGroups,
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
				api.class.mutations.disableSectionGroups,
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
				api.class.mutations.disableSectionGroups,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const result = await authed.mutation(
			api.class.mutations.disableSectionGroups,
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
			api.student.queries.getById,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		await authed.mutation(
			api.class.mutations.updateBatchNamingConvention,
			withSlug(ins1, {
				classId: classes.class1._id,
				namingConvention: "alphabetic",
			}),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
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
				api.class.mutations.updateBatchNamingConvention,
				withSlug(ins1, {
					classId: classes.class1._id,
					namingConvention: "alphabetic",
				}),
			),
			ERROR_CODES.CLASS.BATCHES_NOT_ENABLED,
		);
	});
});

describe("students.create (with batch assignment)", () => {
	test("auto-assigns to least-populated batch when omitted", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		const student = await authed.query(
			api.student.queries.getById,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		const targetBatch = batches[1];

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					batchId: targetBatch._id,
				}),
			),
		);

		const student = await authed.query(
			api.student.queries.getById,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);
		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const otherClassBatches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class2._id }),
		);

		await expectAppError(
			authed.mutation(
				api.student.mutations.create,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);
		const otherClassBatches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class2._id }),
		);

		await expectAppError(
			authed.mutation(
				api.student.mutations.create,
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

describe("classBatches.getRemovePreview", () => {
	const test = classTest();

	test("returns no move target for empty batch", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		const preview = await authed.query(
			api.class.queries.getBatchRemovePreview,
			withSlug(ins1, { batchId: batches[0]._id }),
		);

		expect(preview).toMatchObject({
			batchLabel: "B01",
			studentCount: 0,
			canDelete: true,
		});
		expect(preview.moveToBatch).toBeTruthy();
	});

	test("returns move target for least-populated other batch", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		const batchToDelete = batches[0];
		const otherBatch = batches[1];

		for (let i = 0; i < 2; i++) {
			await authed.mutation(
				api.student.mutations.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						usn: `1MS21CS10${i}`,
						email: `batch-preview${i}@example.com`,
						batchId: batchToDelete._id,
					}),
				),
			);
		}

		const preview = await authed.query(
			api.class.queries.getBatchRemovePreview,
			withSlug(ins1, { batchId: batchToDelete._id }),
		);

		expect(preview).toMatchObject({
			batchLabel: "B01",
			studentCount: 2,
			canDelete: true,
			moveToBatch: {
				_id: otherBatch._id,
				label: "B02",
			},
		});
	});

	test("returns canDelete false for last remaining batch", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		vi.useFakeTimers();
		try {
			await authed.mutation(
				api.class.mutations.removeBatch,
				withSlug(ins1, { batchId: batches[1]._id }),
			);

			await t.finishAllScheduledFunctions(vi.runAllTimers);
		} finally {
			vi.useRealTimers();
		}

		const remaining = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		expect(remaining).toHaveLength(1);

		const preview = await authed.query(
			api.class.queries.getBatchRemovePreview,
			withSlug(ins1, { batchId: remaining[0]._id }),
		);

		expect(preview.canDelete).toBe(false);
	});
});

describe("classBatches.remove", () => {
	const test = classTest();

	test("rejects deleting the last remaining batch", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		vi.useFakeTimers();
		try {
			await authed.mutation(
				api.class.mutations.removeBatch,
				withSlug(ins1, { batchId: batches[1]._id }),
			);

			await t.finishAllScheduledFunctions(vi.runAllTimers);
		} finally {
			vi.useRealTimers();
		}

		const remaining = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		await expectAppError(
			authed.mutation(
				api.class.mutations.removeBatch,
				withSlug(ins1, { batchId: remaining[0]._id }),
			),
			ERROR_CODES.BATCH.LAST_REMAINING,
		);
	});

	test("redistributes students to the previewed batch", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		const batchToDelete = batches[0];

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					batchId: batchToDelete._id,
				}),
			),
		);

		const preview = await authed.query(
			api.class.queries.getBatchRemovePreview,
			withSlug(ins1, { batchId: batchToDelete._id }),
		);

		vi.useFakeTimers();
		try {
			await authed.mutation(
				api.class.mutations.removeBatch,
				withSlug(ins1, { batchId: batchToDelete._id }),
			);

			await t.finishAllScheduledFunctions(vi.runAllTimers);
		} finally {
			vi.useRealTimers();
		}

		const student = await authed.query(
			api.student.queries.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.batchId).toBe(preview.moveToBatch?._id);
		expect(student.batchLabel).toBe(preview.moveToBatch?.label);

		const remainingBatches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		expect(
			remainingBatches.find((b) => b._id === batchToDelete._id),
		).toBeUndefined();
	});

	test("reassigns timetable slots and archives attendance history", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		const batchToDelete = batches[0];
		const preview = await authed.query(
			api.class.queries.getBatchRemovePreview,
			withSlug(ins1, { batchId: batchToDelete._id }),
		);
		const targetBatchId = preview.moveToBatch?._id;
		if (!targetBatchId) throw new Error("Expected move target batch");

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					batchId: batchToDelete._id,
				}),
			),
		);

		const now = Date.now();
		const subjectId = await t.run(async (ctx) => {
			return await ctx.db.insert("subjects", {
				name: "Batch Delete Subject",
				color: "#2563eb",
				code: "BDS101",
				alias: "bds101",
				status: "active",
				institutionId: ins1._id,
				createdAt: now,
				updatedAt: now,
			});
		});

		const { sourceSlotId, registerId, recordId } = await t.run(async (ctx) => {
			const timetableId = await ctx.db.insert("timetable", {
				classId: classes.class1._id,
				version: 1,
				createdBy: user1._id,
				changeMessage: "v1",
				effectiveFrom: now,
				createdAt: now,
				updatedAt: now,
			});

			const sourceSlotId = await ctx.db.insert("timetableSlots", {
				timetableId,
				subjectId,
				batchId: batchToDelete._id,
				day: 0,
				startHour: 0,
				endHour: 1,
				room: "A101",
			});
			await ctx.db.insert("timetableSlots", {
				timetableId,
				subjectId,
				batchId: targetBatchId,
				day: 0,
				startHour: 1,
				endHour: 2,
				room: "A102",
			});

			const registerId = await ctx.db.insert("attendanceRegisters", {
				classId: classes.class1._id,
				subjectId,
				batchId: batchToDelete._id,
				status: "active",
				createdAt: now,
				updatedAt: now,
			});
			const recordId = await ctx.db.insert("attendanceRecords", {
				registerId,
				sessionDate: "2026-01-15",
				day: 0,
				startHour: 0,
				endHour: 1,
				timetableVersion: 1,
				markedBy: user1._id,
				markedAt: now,
				updatedAt: now,
				presentCount: 1,
				absentCount: 0,
			});
			await ctx.db.insert("attendanceEntries", {
				recordId,
				studentId,
				status: "present",
			});
			await ctx.db.insert("attendanceActivityLogs", {
				recordId,
				action: "marked",
				performedBy: user1._id,
				performedAt: now,
				changes: [
					{
						studentId,
						newStatus: "present",
					},
				],
			});

			return { sourceSlotId, registerId, recordId };
		});

		vi.useFakeTimers();
		try {
			await authed.mutation(
				api.class.mutations.removeBatch,
				withSlug(ins1, { batchId: batchToDelete._id }),
			);
			await t.finishAllScheduledFunctions(vi.runAllTimers);
		} finally {
			vi.useRealTimers();
		}

		const sourceSlot = await t.run((ctx) =>
			ctx.db.get("timetableSlots", sourceSlotId),
		);
		expect(sourceSlot?.batchId).toBe(targetBatchId);

		const archivedRegister = await t.run((ctx) =>
			ctx.db.get("attendanceRegisters", registerId),
		);
		expect(archivedRegister?.status).toBe("archived");
		expect(archivedRegister?.archivedAt).toBeTypeOf("number");

		const history = await t.run(async (ctx) => {
			const record = await ctx.db.get("attendanceRecords", recordId);
			const entries = await ctx.db
				.query("attendanceEntries")
				.withIndex("by_record", (q) => q.eq("recordId", recordId))
				.collect();
			const logs = await ctx.db
				.query("attendanceActivityLogs")
				.withIndex("by_record", (q) => q.eq("recordId", recordId))
				.collect();
			return { record, entries, logs };
		});
		expect(history.record).toBeTruthy();
		expect(history.entries).toHaveLength(1);
		expect(history.logs).toHaveLength(1);
	});

	test("blocks deletion when timetable conflicts with destination batch", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		const sourceBatchId = batches[0]._id;
		const targetBatchId = batches[1]._id;

		const now = Date.now();
		const subjectId = await t.run(async (ctx) => {
			return await ctx.db.insert("subjects", {
				name: "Conflict Subject",
				color: "#dc2626",
				code: "CFS101",
				alias: "cfs101",
				status: "active",
				institutionId: ins1._id,
				createdAt: now,
				updatedAt: now,
			});
		});

		await t.run(async (ctx) => {
			const timetableId = await ctx.db.insert("timetable", {
				classId: classes.class1._id,
				version: 1,
				createdBy: user1._id,
				changeMessage: "v1",
				effectiveFrom: now,
				createdAt: now,
				updatedAt: now,
			});

			await ctx.db.insert("timetableSlots", {
				timetableId,
				subjectId,
				batchId: sourceBatchId,
				day: 0,
				startHour: 0,
				endHour: 1,
			});
			await ctx.db.insert("timetableSlots", {
				timetableId,
				subjectId,
				batchId: targetBatchId,
				day: 0,
				startHour: 0,
				endHour: 1,
			});
		});

		const preview = await authed.query(
			api.class.queries.getBatchRemovePreview,
			withSlug(ins1, { batchId: sourceBatchId }),
		);
		expect(preview.hasTimetableConflict).toBe(true);
		expect(preview.blockedReason).toBe(
			ERROR_CODES.BATCH.TIMETABLE_CONFLICT.message,
		);

		await expectAppError(
			authed.mutation(
				api.class.mutations.removeBatch,
				withSlug(ins1, { batchId: sourceBatchId }),
			),
			ERROR_CODES.BATCH.TIMETABLE_CONFLICT,
		);
	});

	test("ignores timetable conflicts from older versions", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		const sourceBatchId = batches[0]._id;
		const targetBatchId = batches[1]._id;

		const now = Date.now();
		const subjectId = await t.run(async (ctx) => {
			return await ctx.db.insert("subjects", {
				name: "Older Conflict Subject",
				color: "#0891b2",
				code: "OCS101",
				alias: "ocs101",
				status: "active",
				institutionId: ins1._id,
				createdAt: now,
				updatedAt: now,
			});
		});

		await t.run(async (ctx) => {
			const oldTimetableId = await ctx.db.insert("timetable", {
				classId: classes.class1._id,
				version: 1,
				createdBy: user1._id,
				changeMessage: "old",
				effectiveFrom: now - 1_000,
				createdAt: now - 1_000,
				updatedAt: now - 1_000,
			});
			await ctx.db.insert("timetableSlots", {
				timetableId: oldTimetableId,
				subjectId,
				batchId: sourceBatchId,
				day: 0,
				startHour: 0,
				endHour: 1,
			});
			await ctx.db.insert("timetableSlots", {
				timetableId: oldTimetableId,
				subjectId,
				batchId: targetBatchId,
				day: 0,
				startHour: 0,
				endHour: 1,
			});

			const latestTimetableId = await ctx.db.insert("timetable", {
				classId: classes.class1._id,
				version: 2,
				createdBy: user1._id,
				changeMessage: "latest",
				effectiveFrom: now,
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("timetableSlots", {
				timetableId: latestTimetableId,
				subjectId,
				batchId: sourceBatchId,
				day: 0,
				startHour: 1,
				endHour: 2,
			});
		});

		const preview = await authed.query(
			api.class.queries.getBatchRemovePreview,
			withSlug(ins1, { batchId: sourceBatchId }),
		);
		expect(preview.hasTimetableConflict).toBe(false);

		vi.useFakeTimers();
		try {
			await authed.mutation(
				api.class.mutations.removeBatch,
				withSlug(ins1, { batchId: sourceBatchId }),
			);
			await t.finishAllScheduledFunctions(vi.runAllTimers);
		} finally {
			vi.useRealTimers();
		}

		const remainingBatches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);
		expect(
			remainingBatches.find((b) => b._id === sourceBatchId),
		).toBeUndefined();
	});

	test("hides deleting batch from list immediately", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const batches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		await authed.mutation(
			api.class.mutations.removeBatch,
			withSlug(ins1, { batchId: batches[0]._id }),
		);

		const listed = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class1._id }),
		);

		expect(listed.find((b) => b._id === batches[0]._id)).toBeUndefined();
		expect(listed).toHaveLength(1);
	});
});

describe("classBatches.listMoveTargets", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.query(
				api.class.queries.listBatchMoveTargets,
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
			api.class.queries.listBatchMoveTargets,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const targets = await authed.query(
			api.class.queries.listBatchMoveTargets,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const targets = await authed.query(
			api.class.queries.listBatchMoveTargets,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);
		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const targets = await authed.query(
			api.class.queries.listBatchMoveTargets,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const targets = await authed.query(
			api.class.queries.listBatchMoveTargets,
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
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const targets = await authed.query(
			api.class.queries.listBatchMoveTargets,
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
				api.class.mutations.splitIntoNewBatch,
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
				api.class.mutations.splitIntoNewBatch,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const studentIds = [];
		for (let i = 0; i < 2; i++) {
			const studentId = await authed.mutation(
				api.student.mutations.create,
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
			api.class.mutations.splitIntoNewBatch,
			withSlug(ins1, { classId: classes.class1._id, studentIds }),
		);

		expect(newBatch.numIdx).toBe(3);
		expect(newBatch.label).toBe("B03");

		for (const studentId of studentIds) {
			const student = await authed.query(
				api.student.queries.getById,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const otherClassStudentId = await authed.mutation(
			api.student.mutations.create,
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
				api.class.mutations.splitIntoNewBatch,
				withSlug(ins1, {
					classId: classes.class1._id,
					studentIds: [otherClassStudentId],
				}),
			),
			ERROR_CODES.STUDENT.NOT_FOUND,
		);
	});
});
