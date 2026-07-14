import { describe, expect } from "vitest";
import { classTest, expectAppError, withSlug } from "#__fixtures__/index.setup";
import { api } from "#_generated/api";
import { ERROR_CODES } from "#helpers/constants";

describe("classes.list", () => {
	const test = classTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(
				api.class.queries.list,
				withSlug(ins1, {
					programId: programs.me._id,
					paginationOpts: { numItems: 10, cursor: null },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists classes for active program", async ({
		ins1,
		ins2,
		programs,
		classes,
		academicAdoptions,
		asOwner,
	}) => {
		const classesList = await asOwner({ _id: ins1.userId }, ins1).query(
			api.class.queries.list,
			withSlug(ins1, {
				programId: programs.me._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(classesList.page).toHaveLength(classes.program1Classes.length);
		expect(classesList.page).toMatchObject(
			classes.program1Classes.map((cls) => ({
				_id: cls._id,
				name: cls.name,
				description: cls.description,
				status: cls.status,
				currentHeadStage: {
					_id: cls.currentHeadStageId,
				},
			})),
		);

		const classesList2 = await asOwner({ _id: ins2.userId }, ins2).query(
			api.class.queries.list,
			withSlug(ins2, {
				programId: programs.ce._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(classesList2.page).toHaveLength(classes.program2Classes.length);
		expect(classesList2.page).toMatchObject(
			classes.program2Classes.map((cls) => ({
				_id: cls._id,
				name: cls.name,
				description: cls.description,
				status: cls.status,
			})),
		);

		expect(classesList.page[0]?.currentHeadStage._id).toBe(
			academicAdoptions.ins1FirstStage._id,
		);

		const searchResult = await asOwner({ _id: ins1.userId }, ins1).query(
			api.class.queries.list,
			withSlug(ins1, {
				programId: programs.me._id,
				paginationOpts: { numItems: 10, cursor: null },
				searchQuery: "Class",
			}),
		);
		expect(searchResult.page.length).toBeGreaterThanOrEqual(1);
	});
});

describe("classes.getById", () => {
	const test = classTest();

	test("rejects unthencticated user", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.query(
				api.class.queries.getById,
				withSlug(ins1, { id: classes.class1._id }),
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
			asOwner(user1, ins1).query(
				api.class.queries.getById,
				withSlug(ins1, { id: classId }),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});

	test("gets class by id", async ({
		user1,
		ins1,
		classes,
		academicAdoptions,
		asOwner,
	}) => {
		const cls = await asOwner(user1, ins1).query(
			api.class.queries.getById,
			withSlug(ins1, { id: classes.class1._id }),
		);

		expect(cls).toMatchObject({
			name: classes.class1.name,
			description: classes.class1.description,
			isGroupsEnabled: false,
			status: "active",
			currentHeadStage: {
				_id: academicAdoptions.ins1FirstStage._id,
				name: academicAdoptions.ins1FirstStage.name,
				alias: academicAdoptions.ins1FirstStage.alias,
			},
		});
	});

	test("rejects class from another institution", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.class.queries.getById,
				withSlug(ins1, { id: classes.class3._id }),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});
});

describe("classes.checkName", () => {
	const test = classTest();

	test("returns available for unused name", async ({
		ins1,
		programs,
		asOwner,
	}) => {
		const result = await asOwner({ _id: ins1.userId }, ins1).query(
			api.class.queries.checkName,
			withSlug(ins1, {
				programId: programs.me._id,
				name: "Unique Class",
			}),
		);

		expect(result).toEqual({ available: true });
	});

	test("returns unavailable for existing name", async ({
		ins1,
		programs,
		classes,
		asOwner,
	}) => {
		const result = await asOwner({ _id: ins1.userId }, ins1).query(
			api.class.queries.checkName,
			withSlug(ins1, {
				programId: programs.me._id,
				name: classes.class1.name,
			}),
		);

		expect(result).toEqual({ available: false });
	});
});

describe("classes.checkSlug", () => {
	const test = classTest();

	test("returns available for unused slug", async ({
		ins1,
		programs,
		asOwner,
	}) => {
		const result = await asOwner({ _id: ins1.userId }, ins1).query(
			api.class.queries.checkSlug,
			withSlug(ins1, {
				programId: programs.me._id,
				classSlug: "unique-class",
			}),
		);

		expect(result).toEqual({ available: true });
	});

	test("returns unavailable for existing slug", async ({
		ins1,
		programs,
		classes,
		asOwner,
	}) => {
		const result = await asOwner({ _id: ins1.userId }, ins1).query(
			api.class.queries.checkSlug,
			withSlug(ins1, {
				programId: programs.me._id,
				classSlug: classes.class1.slug,
			}),
		);

		expect(result).toEqual({ available: false });
	});
});

describe("classes.getBySlug", () => {
	const test = classTest();

	test("gets class by slug", async ({
		user1,
		ins1,
		programs,
		classes,
		asOwner,
	}) => {
		const cls = await asOwner(user1, ins1).query(
			api.class.queries.getBySlug,
			withSlug(ins1, {
				programId: programs.me._id,
				classSlug: classes.class1.slug,
			}),
		);

		expect(cls).toMatchObject({
			_id: classes.class1._id,
			name: classes.class1.name,
			slug: classes.class1.slug,
		});
	});

	test("rejects unknown slug", async ({ user1, ins1, programs, asOwner }) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.class.queries.getBySlug,
				withSlug(ins1, {
					programId: programs.me._id,
					classSlug: "unknown-class",
				}),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});
});
