import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import {
	seedClasses,
	seedInstitutions,
	seedOwners,
	seedPrograms,
} from "./test.helpers";
import { createTest } from "./test.setup";

describe("classes.create", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = institutions[0];
		const secondIns = institutions[1];
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];

		await expect(
			t.mutation(api.classes.create, {
				programId: firstProgram._id,
				body: {
					name: "Class 1",
					description: "Class 1 description",
					academicYear: 2026,
					semester: 1,
				},
			}),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("creates class for active program", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = institutions[0];
		const secondIns = institutions[1];
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];
		const secondProgram = programs[1];

		const firstClassId = await t
			.withIdentity({
				subject: firstIns.userId,
				activeInstitutionId: firstIns._id,
				sessionId: "ses-1",
			})
			.mutation(api.classes.create, {
				programId: firstProgram._id,
				body: {
					name: "Class 1",
					description: "Class 1 description",
					academicYear: 2026,
					semester: 1,
				},
			});

		const secondClassId = await t
			.withIdentity({
				subject: secondIns.userId,
				activeInstitutionId: secondIns._id,
				sessionId: "ses-1",
			})
			.mutation(api.classes.create, {
				programId: secondProgram._id,
				body: {
					name: "Class 2",
					description: "Class 2 description",
					academicYear: 2026,
					semester: 4,
				},
			});

		expect(firstClassId).toBeDefined();
		expect(secondClassId).toBeDefined();

		t.run(async (ctx) => {
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
});

describe("classes.list", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const programId = await t.run(async (ctx) => {
			return await ctx.db.insert("programs", {
				name: "Computer Science",
				alias: "CS",
				createdAt: Date.now(),
				updatedAt: Date.now(),
				createdBy: "user-1",
				institutionId: "ins-1",
				status: "active",
			});
		});

		await expect(
			t.query(api.classes.list, { programId: programId }),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("lists classes for active program", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);
		const firstIns = institutions[0];
		const secondIns = institutions[1];
		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1: firstIns, ins2: secondIns }),
		);
		const firstProgram = programs[0];
		const secondProgram = programs[1];
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
			.query(api.classes.list, {
				programId: firstProgram._id,
			});
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
			.query(api.classes.list, {
				programId: secondProgram._id,
			});
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

		const classId = await t.run(async (ctx) => {
			return await ctx.db.insert("classes", {
				programId: "prog-1",
				name: "Class 1",
				description: "Class 1 description",
				isGroupsEnabled: false,
				academicYear: 2026,
				semester: 1,
				status: "active",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		await expect(t.query(api.classes.getById, { id: classId })).rejects.toThrow(
			ERROR_CODES.BASE.UNAUTHORIZED.message,
		);
	});

	it("rejects if class doesn't exist", async () => {
		const t = createTest();

		const classId = await t.run(async (ctx) => {
			const clsId = await ctx.db.insert("classes", {
				programId: "prog-1",
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

		await expect(
			t
				.withIdentity({
					subject: "user-1",
					activeInstitutionId: "ins-1",
					sessionId: "ses-1",
				})
				.query(api.classes.getById, { id: classId }),
		).rejects.toThrow(ERROR_CODES.BASE.CLASS_NOT_FOUND.message);
	});

	it("gets class by id", async () => {
		const t = createTest();

		const classId = await t.run(async (ctx) => {
			return await ctx.db.insert("classes", {
				programId: "prog-1",
				name: "Class 1",
				description: "Class 1 description",
				isGroupsEnabled: false,
				academicYear: 2026,
				semester: 1,
				status: "active",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const cls = await t
			.withIdentity({
				subject: "user-1",
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.classes.getById, { id: classId });
		expect(cls).toMatchObject({
			name: "Class 1",
			description: "Class 1 description",
			isGroupsEnabled: false,
			academicYear: 2026,
			semester: 1,
			status: "active",
		});
	});
});

describe("classes.updateBasicInfo", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		const classId = await t.run(async (ctx) => {
			return await ctx.db.insert("classes", {
				programId: "prog-1",
				name: "Class 1",
				description: "Class 1 description",
				isGroupsEnabled: false,
				academicYear: 2026,
				semester: 1,
				status: "active",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		await expect(
			t.mutation(api.classes.updateBasicInfo, {
				id: classId,
				body: { name: "Class 2", description: "Class 2 description" },
			}),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	// it("rejects if class doesn't exist", async () => {
	// 	const t = createTest();

	// 	const classId = await t.run(async (ctx) => {
	// 		const clsId = await ctx.db.insert("classes", {
	// 			programId: "prog-1",
	// 			name: "Class 1",
	// 			description: "Class 1 description",
	// 			isGroupsEnabled: false,
	// 			academicYear: 2026,
	// 			semester: 1,
	// 			status: "active",
	// 			createdAt: Date.now(),
	// 			updatedAt: Date.now(),
	// 		});
	// 		await ctx.db.delete("classes", clsId);
	// 		return clsId;
	// 	});
	// 	await expect(
	// 		t
	// 			.withIdentity({
	// 				subject: "user-1",
	// 				activeInstitutionId: "ins-1",
	// 				sessionId: "ses-1",
	// 			})
	// 			.mutation(api.classes.updateBasicInfo, {
	// 				id: classId,
	// 				body: { name: "Class 2", description: "Class 2 description" },
	// 			}),
	// 	).rejects.toThrow(ERROR_CODES.BASE.CLASS_NOT_FOUND.message);
	// });

	it("updates class basic info", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);
		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const ins1 = institutions[0];
		const ins2 = institutions[1];

		const programs = await t.run((ctx) =>
			seedPrograms(ctx, { user1, user2, ins1, ins2 }),
		);
		const firstProgram = programs[0];
		const secondProgram = programs[1];
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
			.mutation(api.classes.updateBasicInfo, {
				id: classes.program1Classes[0]._id,
				body: { name: "Class 1 Updated" },
			});

		const patchedClass = await t.run((ctx) =>
			ctx.db
				.query("classes")
				.withIndex("by_id", (q) => q.eq("_id", classes.program1Classes[0]._id))
				.first(),
		);

		expect(patchedClass).toMatchObject({
			name: "Class 1 Updated",
			description: classes.program1Classes[0].description,
		});

		// const classId = await t.run(async (ctx) => {
		// 	return await ctx.db.insert("classes", {
		// 		programId: "prog-1",
		// 		name: "Class 1",
		// 		description: "Class 1 description",
		// 		isGroupsEnabled: false,
		// 		academicYear: 2026,
		// 		semester: 1,
		// 		status: "active",
		// 		createdAt: Date.now(),
		// 		updatedAt: Date.now(),
		// 	});
		// });

		// await t
		// 	.withIdentity({
		// 		subject: "user-1",
		// 		activeInstitutionId: "ins-1",
		// 		sessionId: "ses-1",
		// 	})
		// 	.mutation(api.classes.updateBasicInfo, {
		// 		id: classId,
		// 		body: { name: "Class 2", description: "Class 2 description" },
		// 	});
		// await t.run(async (ctx) => {
		// 	const updatedClass = await ctx.db
		// 		.query("classes")
		// 		.withIndex("by_id", (q) => q.eq("_id", classId))
		// 		.first();

		// 	expect(updatedClass).toMatchObject({
		// 		name: "Class 2",
		// 		description: "Class 2 description",
		// 	});
		// });
	});
});
