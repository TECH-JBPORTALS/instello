import { describe, expect } from "vitest";
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
} from "#__fixtures__/index.setup";
import { api } from "#_generated/api";
import { ERROR_CODES } from "#helpers/constants";

const test = institutionTest();

describe("faculty.create", () => {
	test("requires authentication", async ({ t, ins1 }) => {
		await expectAppError(
			t.mutation(
				api.faculty.mutations.create,
				withSlug(ins1, createFacultyInput()),
			),
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
			api.faculty.mutations.create,
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
			status: "draft",
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
			api.faculty.mutations.create,
			withSlug(ins1, createFacultyInput()),
		);

		await expectAppError(
			authed.mutation(
				api.faculty.mutations.create,
				withSlug(ins1, createFacultyInput()),
			),
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
			api.faculty.mutations.create,
			withSlug(ins1, createFacultyInput()),
		);

		await expectAppError(
			authed.mutation(
				api.faculty.mutations.create,
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
			api.faculty.mutations.create,
			withSlug(ins1, createFacultyInput()),
		);

		const id2 = await asOwner(user2, ins2).mutation(
			api.faculty.mutations.create,
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
				api.faculty.mutations.create,
				withSlug(ins1, createFacultyInput()),
			),
			ERROR_CODES.BASE.ACCESS_DENIED,
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
			api.faculty.mutations.updatePersonalInfo,
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
				api.faculty.mutations.updatePersonalInfo,
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
				api.faculty.mutations.updatePersonalInfo,
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
			api.faculty.mutations.updatePhoneNumber,
			withSlug(ins1, {
				id: facultyId,
				body: { number: "9999999999" },
			}),
		);

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated?.phone).toEqual({
			number: "9999999999",
			verified: false,
		});
	});
});

describe("faculty.invite", () => {
	test("marks draft faculty as invited", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "draft" },
			}),
		);

		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.mutations.invite,
			withSlug(ins1, { id: facultyId }),
		);

		const faculty = await authed.query(
			api.faculty.queries.getById,
			withSlug(ins1, { id: facultyId }),
		);
		expect(faculty.status).toBe("invited");
	});

	test("rejects inviting non-draft faculty", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "active" },
			}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.faculty.mutations.invite,
				withSlug(ins1, { id: facultyId }),
			),
			ERROR_CODES.FACULTY.NOT_DRAFT,
		);
	});
});

describe("faculty.cancelInvite", () => {
	test("reverts invited faculty to draft", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "invited" },
			}),
		);

		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.mutations.cancelInvite,
			withSlug(ins1, { id: facultyId }),
		);

		const faculty = await authed.query(
			api.faculty.queries.getById,
			withSlug(ins1, { id: facultyId }),
		);
		expect(faculty.status).toBe("draft");
	});

	test("no-ops when faculty is already draft", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "draft" },
			}),
		);

		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.mutations.cancelInvite,
			withSlug(ins1, { id: facultyId }),
		);

		const faculty = await authed.query(
			api.faculty.queries.getById,
			withSlug(ins1, { id: facultyId }),
		);
		expect(faculty.status).toBe("draft");
	});

	test("rejects cancelling non-invited faculty", async ({
		t,
		user1,
		ins1,
		asOwner,
	}) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "active" },
			}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.faculty.mutations.cancelInvite,
				withSlug(ins1, { id: facultyId }),
			),
			ERROR_CODES.FACULTY.NOT_INVITED,
		);
	});
});

describe("faculty.deactivate", () => {
	test("deactivates a faculty member", async ({ t, user1, ins1, asOwner }) => {
		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "active" },
			}),
		);

		const authed = asOwner(user1, ins1);

		await authed.mutation(
			api.faculty.mutations.deactivate,
			withSlug(ins1, { id: facultyId }),
		);

		const faculty = await authed.query(
			api.faculty.queries.getById,
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
			api.faculty.mutations.activate,
			withSlug(ins1, { id: facultyId }),
		);

		const faculty = await authed.query(
			api.faculty.queries.getById,
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
			api.faculty.mutations.updateEmployment,
			withSlug(ins1, {
				id: facultyId,
				body: { designation: "Associate Professor" },
			}),
		);

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated?.designation).toBe("Associate Professor");
	});
});
