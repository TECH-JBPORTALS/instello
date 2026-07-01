import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	classTest,
	createClassBody,
	expectAppError,
	programTest,
	withSlug,
} from "./fixtures";

describe("classes.create", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.mutation(
				api.classes.create,
				withSlug(ins1, {
					programId: programs.me._id,
					body: createClassBody(),
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
		asOwner,
	}) => {
		const firstClassId = await asOwner({ _id: ins1.userId }, ins1).mutation(
			api.classes.create,
			withSlug(ins1, {
				programId: programs.me._id,
				body: createClassBody(),
			}),
		);

		const secondClassId = await asOwner({ _id: ins2.userId }, ins2).mutation(
			api.classes.create,
			withSlug(ins2, {
				programId: programs.ce._id,
				body: createClassBody({
					name: "Class 2",
					description: "Class 2 description",
					semester: 4,
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
					description: "Class 1 description",
					academicYear: 2026,
					semester: 1,
				},
				{
					name: "Class 2",
					description: "Class 2 description",
					academicYear: 2026,
					semester: 4,
				},
			]);
		});
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.classes.create,
				withSlug(ins1, {
					programId: programs.ce._id,
					body: createClassBody(),
				}),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("classes.list", () => {
	const test = classTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(api.classes.list, withSlug(ins1, { programId: programs.me._id })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists classes for active program", async ({
		ins1,
		ins2,
		programs,
		classes,
		asOwner,
	}) => {
		const classesList = await asOwner({ _id: ins1.userId }, ins1).query(
			api.classes.list,
			withSlug(ins1, { programId: programs.me._id }),
		);

		expect(classesList).toHaveLength(classes.program1Classes.length);
		expect(classesList).toMatchObject(
			classes.program1Classes.map((cls) => ({
				_id: cls._id,
				name: cls.name,
				description: cls.description,
				isGroupsEnabled: cls.isGroupsEnabled,
				academicYear: cls.academicYear,
				semester: cls.semester,
				status: cls.status,
			})),
		);

		const classesList2 = await asOwner({ _id: ins2.userId }, ins2).query(
			api.classes.list,
			withSlug(ins2, { programId: programs.ce._id }),
		);

		expect(classesList2).toHaveLength(classes.program2Classes.length);
		expect(classesList2).toMatchObject(
			classes.program2Classes.map((cls) => ({
				_id: cls._id,
				name: cls.name,
				description: cls.description,
				isGroupsEnabled: cls.isGroupsEnabled,
				academicYear: cls.academicYear,
				semester: cls.semester,
				status: cls.status,
			})),
		);
	});
});

describe("classes.getById", () => {
	const test = classTest();

	test("rejects unthencticated user", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.query(api.classes.getById, withSlug(ins1, { id: classes.class1._id })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("rejects if class doesn't exist", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const classId = await t.run(async (ctx) => {
			const clsId = await ctx.db.insert("classes", {
				programId: programs.me._id,
				name: "Class 1",
				description: "Class 1 description",
				isGroupsEnabled: false,
				academicYear: 2026,
				semester: 1,
				status: "active",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			await ctx.db.delete("classes", clsId);
			return clsId;
		});

		await expectAppError(
			asOwner(user1, ins1).query(
				api.classes.getById,
				withSlug(ins1, { id: classId }),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});

	test("gets class by id", async ({ user1, ins1, classes, asOwner }) => {
		const cls = await asOwner(user1, ins1).query(
			api.classes.getById,
			withSlug(ins1, { id: classes.class1._id }),
		);

		expect(cls).toMatchObject({
			name: classes.class1.name,
			description: classes.class1.description,
			isGroupsEnabled: false,
			academicYear: classes.class1.academicYear,
			semester: classes.class1.semester,
			status: "active",
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
				api.classes.getById,
				withSlug(ins1, { id: classes.class3._id }),
			),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});
});

describe("classes.updateBasicInfo", () => {
	const test = classTest();

	test("rejects unthencticated user", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.classes.updateBasicInfo,
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
		asOwner,
	}) => {
		const classId = await t.run(async (ctx) => {
			const clsId = await ctx.db.insert("classes", {
				programId: programs.me._id,
				name: "Class 1",
				description: "Class 1 description",
				isGroupsEnabled: false,
				academicYear: 2026,
				semester: 1,
				status: "active",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			await ctx.db.delete("classes", clsId);
			return clsId;
		});

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.classes.updateBasicInfo,
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
			api.classes.updateBasicInfo,
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
			description: classes.class1.description,
		});
	});
});
