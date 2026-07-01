import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	createFacultyInput,
	expectAppError,
	FACULTY_EMAIL,
	FACULTY_PHONE,
	FACULTY_STAFF_ID,
	institutionTest,
	seedFaculty,
	seedFacultyMember,
	withSlug,
} from "./fixtures";

const test = institutionTest();

describe("faculty.create", () => {
	test("requires authentication", async ({ t, ins1 }) => {
		await expectAppError(
			t.mutation(api.faculty.create, withSlug(ins1, createFacultyInput())),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("creates a faculty member with all fields", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await asOwner(user1, ins1).mutation(
			api.faculty.create,
			withSlug(ins1, createFacultyInput()),
		);

		expect(facultyId).toBeDefined();

		const faculty = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(faculty).toMatchObject({
			staffId: FACULTY_STAFF_ID,
			firstName: "Jane",
			lastName: "Doe",
			email: FACULTY_EMAIL,
			designation: "Professor",
			status: "active",
			phone: { number: FACULTY_PHONE, verified: false },
			institutionId: ins1._id,
			createdBy: user1._id,
		});
	});

	test("rejects duplicate email within the same institution", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.create,
			withSlug(ins1, createFacultyInput()),
		);

		await expectAppError(
			authed.mutation(api.faculty.create, withSlug(ins1, createFacultyInput())),
			ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS,
		);
	});

	test("rejects duplicate staff ID within the same institution", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.create,
			withSlug(ins1, createFacultyInput()),
		);

		await expectAppError(
			authed.mutation(
				api.faculty.create,
				withSlug(ins1, {
					...createFacultyInput(),
					email: "other@example.com",
				}),
			),
			ERROR_CODES.FACULTY.STAFF_ID_ALREADY_EXISTS,
		);
	});

	test("allows the same email in different institutions", async ({
		user1,
		user2,
		ins1,
		ins2,
		asOwner,
	}) => {
		const id1 = await asOwner(user1, ins1).mutation(
			api.faculty.create,
			withSlug(ins1, createFacultyInput()),
		);

		const id2 = await asOwner(user2, ins2).mutation(
			api.faculty.create,
			withSlug(ins2, createFacultyInput()),
		);

		expect(id1).toBeDefined();
		expect(id2).toBeDefined();
		expect(id1).not.toEqual(id2);
	});

	test("requires faculty:create permission", async ({ t, ins1, asOwner }) => {
		const facultyUser = await t.run((ctx) =>
			seedFacultyMember(ctx, { institutionId: ins1._id }),
		);

		await expectAppError(
			asOwner(facultyUser, ins1).mutation(
				api.faculty.create,
				withSlug(ins1, createFacultyInput()),
			),
			ERROR_CODES.BASE.ACCESS_DENIED,
		);
	});
});

describe("faculty.list", () => {
	test("returns faculty only for the active institution", async ({
		t,
		user1,
		user2,
		ins1,
		ins2,
		asOwner,
	}) => {
		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);
		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins2._id,
				createdBy: user2._id,
				overrides: { email: "other@example.com", staffId: "STAFF-002" },
			}),
		);

		const result = await asOwner(user1, ins1).query(
			api.faculty.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(1);
		expect(result.page[0]).toMatchObject({
			email: FACULTY_EMAIL,
			status: "active",
		});
	});

	test("filters faculty by status", async ({ t, user1, ins1, asOwner }) => {
		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: {
					email: "active@example.com",
					staffId: "STAFF-A",
					status: "active",
				},
			}),
		);
		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: {
					email: "inactive@example.com",
					staffId: "STAFF-I",
					status: "inactive",
				},
			}),
		);

		const activeResult = await asOwner(user1, ins1).query(
			api.faculty.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 10, cursor: null },
				status: "active",
			}),
		);

		expect(activeResult.page).toHaveLength(1);
		expect(activeResult.page[0]?.email).toBe("active@example.com");
	});

	test("paginates faculty results", async ({ t, user1, ins1, asOwner }) => {
		for (let i = 0; i < 3; i++) {
			await t.run((ctx) =>
				seedFaculty(ctx, {
					institutionId: ins1._id,
					createdBy: user1._id,
					overrides: {
						email: `faculty${i}@example.com`,
						staffId: `STAFF-${i}`,
					},
				}),
			);
		}

		const firstPage = await asOwner(user1, ins1).query(
			api.faculty.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 2, cursor: null },
			}),
		);

		expect(firstPage.page).toHaveLength(2);
		expect(firstPage.isDone).toBe(false);

		const secondPage = await asOwner(user1, ins1).query(
			api.faculty.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
			}),
		);

		expect(secondPage.page).toHaveLength(1);
		expect(secondPage.isDone).toBe(true);
	});
});

describe("faculty.getById", () => {
	test("returns faculty by id for the active institution", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const faculty = await asOwner(user1, ins1).query(
			api.faculty.getById,
			withSlug(ins1, { id: facultyId }),
		);

		expect(faculty).toMatchObject({
			_id: facultyId,
			email: FACULTY_EMAIL,
			phone: { verified: false },
		});
	});

	test("requires institution access", async ({
		t,
		user1,
		user2,
		ins1,
		ins2,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins2._id,
				createdBy: user2._id,
			}),
		);

		await expectAppError(
			asOwner(user1, ins1).query(
				api.faculty.getById,
				withSlug(ins1, { id: facultyId }),
			),
			ERROR_CODES.FACULTY.NOT_FOUND,
		);
	});
});

describe("faculty.updatePersonalInfo", () => {
	test("updates personal information", async ({ t, user1, ins1, asOwner }) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.faculty.updatePersonalInfo,
			withSlug(ins1, {
				id: facultyId,
				body: { firstName: "Janet", lastName: "Smith" },
			}),
		);

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated).toMatchObject({
			firstName: "Janet",
			lastName: "Smith",
			email: FACULTY_EMAIL,
		});
	});

	test("rejects duplicate email on update", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "unique@example.com", staffId: "STAFF-U" },
			}),
		);

		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "taken@example.com", staffId: "STAFF-T" },
			}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.faculty.updatePersonalInfo,
				withSlug(ins1, {
					id: facultyId,
					body: { email: "taken@example.com" },
				}),
			),
			ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS,
		);
	});

	test("requires faculty:update permission", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const facultyUser = await t.run((ctx) =>
			seedFacultyMember(ctx, { institutionId: ins1._id }),
		);

		await expectAppError(
			asOwner(facultyUser, ins1).mutation(
				api.faculty.updatePersonalInfo,
				withSlug(ins1, {
					id: facultyId,
					body: { firstName: "Hacker" },
				}),
			),
			ERROR_CODES.BASE.ACCESS_DENIED,
		);
	});
});

describe("faculty.updatePhoneNumber", () => {
	test("updates phone number and resets verified to false", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { phoneVerified: true },
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.faculty.updatePhoneNumber,
			withSlug(ins1, {
				id: facultyId,
				body: { number: "+919999999999" },
			}),
		);

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated?.phone).toEqual({
			number: "+919999999999",
			verified: false,
		});
	});
});

describe("faculty.deactivate", () => {
	test("deactivates a faculty member", async ({ t, user1, ins1, asOwner }) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.deactivate,
			withSlug(ins1, { id: facultyId }),
		);

		const faculty = await authed.query(
			api.faculty.getById,
			withSlug(ins1, { id: facultyId }),
		);
		expect(faculty.status).toBe("inactive");
	});
});

describe("faculty.activate", () => {
	test("activates a faculty member", async ({ t, user1, ins1, asOwner }) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "inactive" },
			}),
		);

		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.activate,
			withSlug(ins1, { id: facultyId }),
		);

		const faculty = await authed.query(
			api.faculty.getById,
			withSlug(ins1, { id: facultyId }),
		);
		expect(faculty.status).toBe("active");
	});
});

describe("faculty.updateEmployment", () => {
	test("updates employment information", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await asOwner(user1, ins1).mutation(
			api.faculty.updateEmployment,
			withSlug(ins1, {
				id: facultyId,
				body: { designation: "Associate Professor" },
			}),
		);

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated?.designation).toBe("Associate Professor");
	});
});
