import { describe, expect, vi } from "vitest";
import { api } from "../../_generated/api";
import { ERROR_CODES } from "../../helpers/constants";
import {
	classTest,
	createClassBody,
	expectAppError,
	programTest,
	withSlug,
} from "../../tests/fixtures/index.setup";

describe("classes.create", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({
		t,
		ins1,
		programs,
		academicAdoptions,
	}) => {
		await expectAppError(
			t.mutation(
				api.class.mutations.create,
				withSlug(ins1, {
					programId: programs.me._id,
					body: createClassBody(academicAdoptions.ins1FirstStage._id),
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("creates class for active program", async ({
		t,
		ins1,
		ins2,
		programs,
		academicAdoptions,
		asOwner,
	}) => {
		const firstClassId = await asOwner({ _id: ins1.userId }, ins1).mutation(
			api.class.mutations.create,
			withSlug(ins1, {
				programId: programs.me._id,
				body: createClassBody(academicAdoptions.ins1FirstStage._id),
			}),
		);

		const secondClassId = await asOwner({ _id: ins2.userId }, ins2).mutation(
			api.class.mutations.create,
			withSlug(ins2, {
				programId: programs.ce._id,
				body: createClassBody(academicAdoptions.ins2FirstStage._id, {
					name: "Class 2",
					slug: "class-2",
					description: "Class 2 description",
					currentHeadStageId: academicAdoptions.ins2FirstStage._id,
				}),
			}),
		);

		expect(firstClassId).toBeDefined();
		expect(secondClassId).toBeDefined();

		await t.run(async (ctx) => {
			const classes = await ctx.db.query("classes").collect();
			expect(classes).toHaveLength(2);
			expect(classes).toMatchObject([
				{
					name: "Class 1",
					slug: "class-1",
					description: "Class 1 description",
					currentHeadStageId: academicAdoptions.ins1FirstStage._id,
				},
				{
					name: "Class 2",
					slug: "class-2",
					description: "Class 2 description",
					currentHeadStageId: academicAdoptions.ins2FirstStage._id,
				},
			]);
		});
	});

	test("rejects duplicate class name in same program", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.class.mutations.create,
			withSlug(ins1, {
				programId: programs.me._id,
				body: createClassBody(academicAdoptions.ins1FirstStage._id),
			}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.class.mutations.create,
				withSlug(ins1, {
					programId: programs.me._id,
					body: createClassBody(academicAdoptions.ins1FirstStage._id),
				}),
			),
			ERROR_CODES.CLASS.NAME_ALREADY_EXISTS,
		);
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.class.mutations.create,
				withSlug(ins1, {
					programId: programs.ce._id,
					body: createClassBody(academicAdoptions.ins1FirstStage._id),
				}),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});

	test("rejects when institution has no adopted pattern", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
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
				api.class.mutations.create,
				withSlug(ins1, {
					programId: programs.me._id,
					body: createClassBody(academicAdoptions.ins1FirstStage._id),
				}),
			),
			ERROR_CODES.INSTITUTION_ACADEMIC_PATTERN.NOT_FOUND,
		);
	});

	test("rejects stage from another pattern", async ({
		user1,
		ins1,
		programs,
		academicAdoptions,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.class.mutations.create,
				withSlug(ins1, {
					programId: programs.me._id,
					body: createClassBody(academicAdoptions.ins2FirstStage._id),
				}),
			),
			ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND,
		);
	});
});

describe("classes.updateBasicInfo", () => {
	const test = classTest();

	test("rejects unthencticated user", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.class.mutations.updateBasicInfo,
				withSlug(ins1, {
					id: classes.class1._id,
					body: { name: "Class 2", description: "Class 2 description" },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("rejects if class doesn't exist", async ({
		t,
		user1,
		ins1,
		programs,
		academicAdoptions,
		asOwner,
	}) => {
		const classId = await t.run(async (ctx) => {
			const clsId = await ctx.db.insert("classes", {
				programId: programs.me._id,
				name: "Class 1",
				slug: "class-1",
				description: "Class 1 description",
				isGroupsEnabled: false,
				currentHeadStageId: academicAdoptions.ins1FirstStage._id,
				status: "active",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			await ctx.db.delete("classes", clsId);
			return clsId;
		});

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.class.mutations.updateBasicInfo,
				withSlug(ins1, {
					id: classId,
					body: { name: "Class 2", description: "Class 2 description" },
				}),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});

	test("updates class basic info", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.class.mutations.updateBasicInfo,
			withSlug(ins1, {
				id: classes.class1._id,
				body: { name: "Class 1 Updated" },
			}),
		);

		const patchedClass = await t.run((ctx) =>
			ctx.db.get("classes", classes.class1._id),
		);

		expect(patchedClass).toMatchObject({
			name: "Class 1 Updated",
			slug: classes.class1.slug,
			description: classes.class1.description,
		});
	});
});

describe("classes.remove", () => {
	const test = classTest();

	test("rejects unauthenticated user", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.class.mutations.remove,
				withSlug(ins1, { id: classes.class1._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("marks class deleting and hides it from getBySlug", async ({
		t,
		user1,
		ins1,
		programs,
		classes,
		asOwner,
	}) => {
		await asOwner(user1, ins1).mutation(
			api.class.mutations.remove,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const deleted = await t.run((ctx) =>
			ctx.db.get("classes", classes.class2._id),
		);
		expect(deleted?.isDeleting).toBe(true);

		await expectAppError(
			asOwner(user1, ins1).query(
				api.class.queries.getBySlug,
				withSlug(ins1, {
					programId: programs.me._id,
					classSlug: classes.class2.slug,
				}),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);

		await expectAppError(
			asOwner(user1, ins1).query(
				api.class.queries.getById,
				withSlug(ins1, { id: classes.class2._id }),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);

		const listed = await asOwner(user1, ins1).query(
			api.class.queries.list,
			withSlug(ins1, {
				programId: programs.me._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);
		expect(
			listed.page.find((c) => c._id === classes.class2._id),
		).toBeUndefined();
	});

	test("cascade eventually deletes the class document", async ({
		t,
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		vi.useFakeTimers();
		try {
			await asOwner(user1, ins1).mutation(
				api.class.mutations.remove,
				withSlug(ins1, { id: classes.class1._id }),
			);

			await t.finishAllScheduledFunctions(vi.runAllTimers);

			const gone = await t.run((ctx) =>
				ctx.db.get("classes", classes.class1._id),
			);
			expect(gone).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});
});
