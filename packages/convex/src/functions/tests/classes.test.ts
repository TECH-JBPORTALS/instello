import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	expectAppError,
	primaryIns,
	secondaryIns,
	seedClasses,
	seedInstitutions,
	seedOwners,
	seedPrograms,
	withSlug,
} from "./test.helpers";
import { createTest } from "./test.setup";

describe("classes.create", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = primaryIns(institutions);
		const secondIns = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];

		await expectAppError(
			t.mutation(
				api.classes.create,
				withSlug(firstIns, {
					programId: firstProgram._id,
					body: {
						name: "Class 1",
						description: "Class 1 description",
						academicYear: 2026,
						semester: 1,
					},
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	it("creates class for active program", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = primaryIns(institutions);
		const secondIns = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];
		const secondProgram = programs[2];

		const firstClassId = await t
			.withIdentity({
				subject: firstIns.userId,
				activeInstitutionId: firstIns._id,
				sessionId: "ses-1",
			})
			.mutation(
				api.classes.create,
				withSlug(firstIns, {
					programId: firstProgram._id,
					body: {
						name: "Class 1",
						description: "Class 1 description",
						academicYear: 2026,
						semester: 1,
					},
				}),
			);

		const secondClassId = await t
			.withIdentity({
				subject: secondIns.userId,
				activeInstitutionId: secondIns._id,
				sessionId: "ses-1",
			})
			.mutation(
				api.classes.create,
				withSlug(secondIns, {
					programId: secondProgram._id,
					body: {
						name: "Class 2",
						description: "Class 2 description",
						academicYear: 2026,
						semester: 4,
					},
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

	it("rejects program from another institution", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const programInIns2 = programs[2];

		await expectAppError(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.mutation(
					api.classes.create,
					withSlug(ins1, {
						programId: programInIns2._id,
						body: {
							name: "Class 1",
							description: "Class 1 description",
							academicYear: 2026,
							semester: 1,
						},
					}),
				),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("classes.list", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);

		await expectAppError(
			t.query(api.classes.list, withSlug(ins1, { programId: programs[0]._id })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	it("lists classes for active program", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = primaryIns(institutions);
		const secondIns = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];
		const secondProgram = programs[2];
		const classes = await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: firstProgram._id,
				program2Id: secondProgram._id,
			}),
		);

		const classesList = await t
			.withIdentity({
				subject: firstIns.userId,
				activeInstitutionId: firstIns._id,
				sessionId: "ses-1",
			})
			.query(
				api.classes.list,
				withSlug(firstIns, { programId: firstProgram._id }),
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

		const classesList2 = await t
			.withIdentity({
				subject: secondIns.userId,
				activeInstitutionId: secondIns._id,
				sessionId: "ses-1",
			})
			.query(
				api.classes.list,
				withSlug(secondIns, { programId: secondProgram._id }),
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
	it("rejects unthencticated user", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const classes = await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: programs[0]._id,
				program2Id: programs[1]._id,
			}),
		);
		const classId = classes.program1Classes[0]._id;

		await expectAppError(
			t.query(api.classes.getById, withSlug(ins1, { id: classId })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	it("rejects if class doesn't exist", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);

		const classId = await t.run(async (ctx) => {
			const clsId = await ctx.db.insert("classes", {
				programId: programs[0]._id,
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
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.query(api.classes.getById, withSlug(ins1, { id: classId })),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});

	it("gets class by id", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const classes = await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: programs[0]._id,
				program2Id: programs[1]._id,
			}),
		);
		const classId = classes.program1Classes[0]._id;

		const cls = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.query(api.classes.getById, withSlug(ins1, { id: classId }));
		expect(cls).toMatchObject({
			name: classes.program1Classes[0].name,
			description: classes.program1Classes[0].description,
			isGroupsEnabled: false,
			academicYear: classes.program1Classes[0].academicYear,
			semester: classes.program1Classes[0].semester,
			status: "active",
		});
	});

	it("rejects class from another institution", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const classes = await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: programs[0]._id,
				program2Id: programs[2]._id,
			}),
		);
		const classInIns2 = classes.program2Classes[0]._id;

		await expectAppError(
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.query(api.classes.getById, withSlug(ins1, { id: classInIns2 })),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});
});

describe("classes.updateBasicInfo", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const classes = await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: programs[0]._id,
				program2Id: programs[1]._id,
			}),
		);
		const classId = classes.program1Classes[0]._id;

		await expectAppError(
			t.mutation(
				api.classes.updateBasicInfo,
				withSlug(ins1, {
					id: classId,
					body: { name: "Class 2", description: "Class 2 description" },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	it("rejects if class doesn't exist", async () => {
		const t = createTest();
		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);

		const classId = await t.run(async (ctx) => {
			const clsId = await ctx.db.insert("classes", {
				programId: programs[0]._id,
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
			t
				.withIdentity({
					subject: user1._id,
					activeInstitutionId: ins1._id,
					sessionId: "ses-1",
				})
				.mutation(
					api.classes.updateBasicInfo,
					withSlug(ins1, {
						id: classId,
						body: { name: "Class 2", description: "Class 2 description" },
					}),
				),
			ERROR_CODES.CLASS.NOT_FOUND,
		);
	});

	it("updates class basic info", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = primaryIns(institutions);
		const ins2 = secondaryIns(institutions);

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const firstProgram = programs[0];
		const secondProgram = programs[2];
		const classes = await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: firstProgram._id,
				program2Id: secondProgram._id,
			}),
		);

		await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: ins1._id,
				sessionId: "ses-1",
			})
			.mutation(
				api.classes.updateBasicInfo,
				withSlug(ins1, {
					id: classes.program1Classes[0]._id,
					body: { name: "Class 1 Updated" },
				}),
			);

		const patchedClass = await t.run((ctx) =>
			ctx.db.get("classes", classes.program1Classes[0]._id),
		);

		expect(patchedClass).toMatchObject({
			name: "Class 1 Updated",
			description: classes.program1Classes[0].description,
		});
	});
});
