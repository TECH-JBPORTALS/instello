import { describe, expect } from "vitest";
import {
	EXPECTED_PROGRAMS_INS1,
	expectAppError,
	FACULTY_EMAIL,
	FACULTY_STAFF_ID,
	OWNER_1_NAME,
	PROGRAM_CS,
	programTest,
	seedFaculty,
	withSlug,
} from "#__fixtures__/index.setup";
import { api } from "#_generated/api";
import { ERROR_CODES } from "#helpers/constants";

describe("programs.checkAlias", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.query(api.program.queries.checkAlias, withSlug(ins1, { alias: "CS" })),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("returns available when alias is not taken", async ({
		user1,
		ins1,
		asOwner,
		programs: _programs,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.program.queries.checkAlias,
			withSlug(ins1, { alias: "unique-alias" }),
		);

		expect(result).toEqual({ available: true });
	});

	test("returns unavailable when alias already exists", async ({
		user1,
		ins1,
		asOwner,
		programs,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.program.queries.checkAlias,
			withSlug(ins1, { alias: programs.cs.alias }),
		);

		expect(result).toEqual({ available: false });
	});
});

describe("programs.getByAlias", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(
				api.program.queries.getByAlias,
				withSlug(ins1, { alias: programs.cs.alias }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets program by alias", async ({ user1, ins1, programs, asOwner }) => {
		const program = await asOwner(user1, ins1).query(
			api.program.queries.getByAlias,
			withSlug(ins1, { alias: programs.cs.alias }),
		);

		expect(program).toMatchObject({
			_id: programs.cs._id,
			name: PROGRAM_CS.name,
			alias: PROGRAM_CS.alias,
			status: "active",
		});
	});

	test("throws error if program alias doesn't exist", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.program.queries.getByAlias,
				withSlug(ins1, { alias: "nonexistent" }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.program.queries.getByAlias,
				withSlug(ins1, { alias: programs.ce.alias }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("programs.list", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1 }) => {
		await expectAppError(
			t.query(api.program.queries.list, withSlug(ins1, {})),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists programs for the active institution ordered by name", async ({
		user1,
		ins1,
		asOwner,
		programs: _programs,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.program.queries.list,
			withSlug(ins1, {}),
		);

		expect(result).toHaveLength(2);
		expect(result).toMatchObject(EXPECTED_PROGRAMS_INS1);
	});

	test("lists programs by name for given query", async ({
		user1,
		ins1,
		asOwner,
		programs: _programs,
	}) => {
		const query1 = await asOwner(user1, ins1).query(
			api.program.queries.list,
			withSlug(ins1, { query: "computer" }),
		);

		expect(query1).toHaveLength(1);
		expect(query1).toMatchObject([
			{
				name: PROGRAM_CS.name,
				alias: PROGRAM_CS.alias,
				status: "active",
				user: { name: OWNER_1_NAME },
			},
		]);

		const query2 = await asOwner(user1, ins1).query(
			api.program.queries.list,
			withSlug(ins1, { query: "some rubbish!" }),
		);
		expect(query2).toHaveLength(0);
		expect(query2).toMatchObject([]);
	});
});

describe("programs.getById", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(
				api.program.queries.getById,
				withSlug(ins1, { id: programs.me._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("gets program by id", async ({ user1, ins1, programs, asOwner }) => {
		const program = await asOwner(user1, ins1).query(
			api.program.queries.getById,
			withSlug(ins1, { id: programs.cs._id }),
		);

		expect(program).toMatchObject({
			name: PROGRAM_CS.name,
			alias: PROGRAM_CS.alias,
			status: "active",
		});
	});

	test("throws error if program doesn't exists", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const programId = await t.run(async (ctx) => {
			await ctx.db.delete("programs", programs.me._id);
			return programs.me._id;
		});

		await expectAppError(
			asOwner(user1, ins1).query(
				api.program.queries.getById,
				withSlug(ins1, { id: programId }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});

	test("rejects program from another institution", async ({
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		await expectAppError(
			asOwner(user1, ins1).query(
				api.program.queries.getById,
				withSlug(ins1, { id: programs.ce._id }),
			),
			ERROR_CODES.PROGRAM.NOT_FOUND,
		);
	});
});

describe("programs.assignStaff", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: "anonymous",
			}),
		);

		await expectAppError(
			t.mutation(
				api.program.queries.assignStaff,
				withSlug(ins1, {
					programId: programs.cs._id,
					facultyId,
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("assigns faculty to a program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyId,
			}),
		);

		const assignment = await t.run((ctx) =>
			ctx.db
				.query("programFaculty")
				.withIndex("by_program", (q) => q.eq("programId", programs.cs._id))
				.unique(),
		);

		expect(assignment).toMatchObject({
			programId: programs.cs._id,
			facultyId,
			isHeadOfProgram: false,
		});
	});

	test("assigns a second faculty to the same program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
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
					staffId: "STAFF-002",
				},
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyId,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyId: otherFacultyId,
			}),
		);

		const assignments = await t.run((ctx) =>
			ctx.db
				.query("programFaculty")
				.withIndex("by_program", (q) => q.eq("programId", programs.cs._id))
				.collect(),
		);

		expect(assignments).toHaveLength(2);
		expect(assignments.map((a) => a.facultyId).sort()).toEqual(
			[facultyId, otherFacultyId].sort(),
		);
	});

	test("is a no-op when the same faculty is already assigned", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const firstId = await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyId,
			}),
		);

		const secondId = await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyId,
			}),
		);

		expect(secondId).toBe(firstId);

		const assignments = await t.run((ctx) =>
			ctx.db
				.query("programFaculty")
				.withIndex("by_program", (q) => q.eq("programId", programs.cs._id))
				.collect(),
		);

		expect(assignments).toHaveLength(1);
	});
});

describe("programs.assignStaffMany", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.mutation(
				api.program.queries.assignStaffMany,
				withSlug(ins1, {
					programId: programs.cs._id,
					facultyIds: [],
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("assigns multiple faculty and skips already assigned", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "a@example.com", staffId: "STAFF-A" },
			}),
		);
		const facultyId2 = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "b@example.com", staffId: "STAFF-B" },
			}),
		);
		const facultyId3 = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "c@example.com", staffId: "STAFF-C" },
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyId,
			}),
		);

		const inserted = await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaffMany,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyIds: [facultyId, facultyId2, facultyId3],
			}),
		);

		expect(inserted).toHaveLength(2);

		const assignments = await t.run((ctx) =>
			ctx.db
				.query("programFaculty")
				.withIndex("by_program", (q) => q.eq("programId", programs.cs._id))
				.collect(),
		);

		expect(assignments).toHaveLength(3);
	});
});

describe("programs.listAssignableFaculty", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(
				api.program.queries.listAssignableFaculty,
				withSlug(ins1, { programId: programs.cs._id }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists institution faculty not already assigned to the program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const assignedId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "assigned@example.com", staffId: "STAFF-A" },
			}),
		);
		const availableId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "available@example.com", staffId: "STAFF-B" },
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.program.queries.assignStaff,
			withSlug(ins1, {
				programId: programs.cs._id,
				facultyId: assignedId,
			}),
		);

		const result = await asOwner(user1, ins1).query(
			api.program.queries.listAssignableFaculty,
			withSlug(ins1, { programId: programs.cs._id }),
		);

		expect(result.map((f) => f._id)).toEqual([availableId]);
		expect(result[0]).toMatchObject({
			email: "available@example.com",
			staffId: "STAFF-B",
		});
	});
});

describe("programs.listFaculty", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		await expectAppError(
			t.query(
				api.program.queries.listFaculty,
				withSlug(ins1, {
					programId: programs.cs._id,
					paginationOpts: { numItems: 10, cursor: null },
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("lists faculty assigned to the program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await t.run(async (ctx) => {
			const now = Date.now();
			await ctx.db.insert("programFaculty", {
				programId: programs.cs._id,
				facultyId,
				isHeadOfProgram: false,
				createdAt: now,
				updatedAt: now,
			});
		});

		const result = await asOwner(user1, ins1).query(
			api.program.queries.listFaculty,
			withSlug(ins1, {
				programId: programs.cs._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(1);
		expect(result.isDone).toBe(true);
		expect(result.page[0]).toMatchObject({
			programId: programs.cs._id,
			facultyId,
			isHeadOfProgram: false,
			faculty: {
				_id: facultyId,
				email: FACULTY_EMAIL,
				staffId: FACULTY_STAFF_ID,
				firstName: "Jane",
				lastName: "Doe",
			},
		});
	});

	test("returns empty page when program has no faculty", async ({
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const result = await asOwner(user1, ins1).query(
			api.program.queries.listFaculty,
			withSlug(ins1, {
				programId: programs.cs._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(0);
		expect(result.isDone).toBe(true);
	});

	test("paginates faculty results", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const facultyIds: string[] = [];
		for (let i = 0; i < 3; i++) {
			const facultyId = await t.run((ctx) =>
				seedFaculty(ctx, {
					institutionId: ins1._id,
					createdBy: user1._id,
					overrides: {
						email: `faculty${i}@example.com`,
						staffId: `STAFF-${i}`,
					},
				}),
			);
			facultyIds.push(facultyId);

			await t.run(async (ctx) => {
				const now = Date.now();
				await ctx.db.insert("programFaculty", {
					programId: programs.cs._id,
					facultyId,
					isHeadOfProgram: false,
					createdAt: now,
					updatedAt: now,
				});
			});
		}

		const firstPage = await asOwner(user1, ins1).query(
			api.program.queries.listFaculty,
			withSlug(ins1, {
				programId: programs.cs._id,
				paginationOpts: { numItems: 2, cursor: null },
			}),
		);

		expect(firstPage.page).toHaveLength(2);
		expect(firstPage.isDone).toBe(false);
		expect(firstPage.page.map((pf) => pf.facultyId)).toEqual([
			facultyIds[0],
			facultyIds[1],
		]);

		const secondPage = await asOwner(user1, ins1).query(
			api.program.queries.listFaculty,
			withSlug(ins1, {
				programId: programs.cs._id,
				paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
			}),
		);

		expect(secondPage.page).toHaveLength(1);
		expect(secondPage.isDone).toBe(true);
		expect(secondPage.page[0]?.facultyId).toBe(facultyIds[2]);
	});

	test("does not list faculty from another program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await t.run(async (ctx) => {
			const now = Date.now();
			await ctx.db.insert("programFaculty", {
				programId: programs.me._id,
				facultyId,
				isHeadOfProgram: false,
				createdAt: now,
				updatedAt: now,
			});
		});

		const result = await asOwner(user1, ins1).query(
			api.program.queries.listFaculty,
			withSlug(ins1, {
				programId: programs.cs._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(0);
		expect(result.isDone).toBe(true);
	});
});

describe("programs.removeStaff", () => {
	const test = programTest();

	test("rejects unthencticated user", async ({ t, ins1, programs }) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: "anonymous",
			}),
		);

		const programFacultyId = await t.run(async (ctx) => {
			const now = Date.now();
			return await ctx.db.insert("programFaculty", {
				programId: programs.cs._id,
				facultyId,
				isHeadOfProgram: false,
				createdAt: now,
				updatedAt: now,
			});
		});

		await expectAppError(
			t.mutation(
				api.program.queries.removeStaff,
				withSlug(ins1, { programFacultyId }),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("removes faculty from a program", async ({
		t,
		user1,
		ins1,
		programs,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const programFacultyId = await t.run(async (ctx) => {
			const now = Date.now();
			return await ctx.db.insert("programFaculty", {
				programId: programs.cs._id,
				facultyId,
				isHeadOfProgram: false,
				createdAt: now,
				updatedAt: now,
			});
		});

		await asOwner(user1, ins1).mutation(
			api.program.queries.removeStaff,
			withSlug(ins1, { programFacultyId }),
		);

		const removed = await t.run((ctx) =>
			ctx.db.get("programFaculty", programFacultyId),
		);
		expect(removed).toBeNull();

		const listed = await asOwner(user1, ins1).query(
			api.program.queries.listFaculty,
			withSlug(ins1, {
				programId: programs.cs._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);
		expect(listed.page).toHaveLength(0);
	});
});
