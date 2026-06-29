import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import {
	createFacultyInput,
	FACULTY_EMAIL,
	FACULTY_PHONE,
	ownerIdentity,
	seedFaculty,
	seedFacultyMember,
	setupTwoInstitutions,
} from "./test.helpers";

describe("faculty.create", () => {
	it("requires authentication", async () => {
		const { t } = await setupTwoInstitutions();

		await expect(
			t.mutation(api.faculty.create, createFacultyInput()),
		).rejects.toThrow(ERROR_CODES.BASE.UNAUTHORIZED.message);
	});

	it("creates a faculty member with all fields", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.mutation(api.faculty.create, createFacultyInput());

		expect(facultyId).toBeDefined();

		const faculty = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(faculty).toMatchObject({
			firstName: "Jane",
			lastName: "Doe",
			email: FACULTY_EMAIL,
			status: "active",
			phone: { number: FACULTY_PHONE, verified: false },
			institutionId: ins1._id,
			createdBy: user1._id,
		});
	});

	it("rejects duplicate email within the same institution", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();
		const authed = t.withIdentity(ownerIdentity(user1._id, ins1._id));

		await authed.mutation(api.faculty.create, createFacultyInput());

		await expect(
			authed.mutation(api.faculty.create, createFacultyInput()),
		).rejects.toThrow(ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS.message);
	});

	it("allows the same email in different institutions", async () => {
		const { t, user1, user2, ins1, ins2 } = await setupTwoInstitutions();

		const id1 = await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.mutation(api.faculty.create, createFacultyInput());

		const id2 = await t
			.withIdentity(ownerIdentity(user2._id, ins2._id))
			.mutation(api.faculty.create, createFacultyInput());

		expect(id1).toBeDefined();
		expect(id2).toBeDefined();
		expect(id1).not.toEqual(id2);
	});

	it("requires faculty:create permission", async () => {
		const { t, ins1 } = await setupTwoInstitutions();

		const facultyUser = await t.run((ctx) =>
			seedFacultyMember(ctx, { institutionId: ins1._id }),
		);

		await expect(
			t
				.withIdentity(ownerIdentity(facultyUser._id, ins1._id))
				.mutation(api.faculty.create, createFacultyInput()),
		).rejects.toThrow(ERROR_CODES.BASE.ACCESS_DENIED.message);
	});
});

describe("faculty.list", () => {
	it("returns faculty only for the active institution", async () => {
		const { t, user1, user2, ins1, ins2 } = await setupTwoInstitutions();

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
				overrides: { email: "other@example.com" },
			}),
		);

		const result = await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.query(api.faculty.list, {
				paginationOpts: { numItems: 10, cursor: null },
			});

		expect(result.page).toHaveLength(1);
		expect(result.page[0]).toMatchObject({
			email: FACULTY_EMAIL,
			status: "active",
		});
	});

	it("filters faculty by status", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "active@example.com", status: "active" },
			}),
		);
		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "inactive@example.com", status: "inactive" },
			}),
		);

		const activeResult = await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.query(api.faculty.list, {
				paginationOpts: { numItems: 10, cursor: null },
				status: "active",
			});

		expect(activeResult.page).toHaveLength(1);
		expect(activeResult.page[0]?.email).toBe("active@example.com");
	});

	it("paginates faculty results", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		for (let i = 0; i < 3; i++) {
			await t.run((ctx) =>
				seedFaculty(ctx, {
					institutionId: ins1._id,
					createdBy: user1._id,
					overrides: { email: `faculty${i}@example.com` },
				}),
			);
		}

		const firstPage = await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.query(api.faculty.list, {
				paginationOpts: { numItems: 2, cursor: null },
			});

		expect(firstPage.page).toHaveLength(2);
		expect(firstPage.isDone).toBe(false);

		const secondPage = await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.query(api.faculty.list, {
				paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
			});

		expect(secondPage.page).toHaveLength(1);
		expect(secondPage.isDone).toBe(true);
	});
});

describe("faculty.getById", () => {
	it("returns faculty by id for the active institution", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const faculty = await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.query(api.faculty.getById, { id: facultyId });

		expect(faculty).toMatchObject({
			_id: facultyId,
			email: FACULTY_EMAIL,
			phone: { verified: false },
		});
	});

	it("requires institution access", async () => {
		const { t, user1, user2, ins1, ins2 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins2._id,
				createdBy: user2._id,
			}),
		);

		await expect(
			t
				.withIdentity(ownerIdentity(user1._id, ins1._id))
				.query(api.faculty.getById, { id: facultyId }),
		).rejects.toThrow(ERROR_CODES.FACULTY.NOT_FOUND.message);
	});
});

describe("faculty.updatePersonalInfo", () => {
	it("updates personal information", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.mutation(api.faculty.updatePersonalInfo, {
				id: facultyId,
				body: { firstName: "Janet", lastName: "Smith" },
			});

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated).toMatchObject({
			firstName: "Janet",
			lastName: "Smith",
			email: FACULTY_EMAIL,
		});
	});

	it("rejects duplicate email on update", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "unique@example.com" },
			}),
		);

		await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { email: "taken@example.com" },
			}),
		);

		await expect(
			t
				.withIdentity(ownerIdentity(user1._id, ins1._id))
				.mutation(api.faculty.updatePersonalInfo, {
					id: facultyId,
					body: { email: "taken@example.com" },
				}),
		).rejects.toThrow(ERROR_CODES.FACULTY.EMAIL_ALREADY_EXISTS.message);
	});

	it("requires faculty:update permission", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const facultyUser = await t.run((ctx) =>
			seedFacultyMember(ctx, { institutionId: ins1._id }),
		);

		await expect(
			t
				.withIdentity(ownerIdentity(facultyUser._id, ins1._id))
				.mutation(api.faculty.updatePersonalInfo, {
					id: facultyId,
					body: { firstName: "Hacker" },
				}),
		).rejects.toThrow(ERROR_CODES.BASE.ACCESS_DENIED.message);
	});
});

describe("faculty.updateAddress", () => {
	it("updates address information", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.mutation(api.faculty.updateAddress, {
				id: facultyId,
				body: {
					addressLine: "456 New Rd",
					district: "Mysuru",
					zipCode: "570001",
				},
			});

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated).toMatchObject({
			addressLine: "456 New Rd",
			district: "Mysuru",
			zipCode: "570001",
			firstName: "Jane",
		});
	});
});

describe("faculty.updatePhoneNumber", () => {
	it("updates phone number and resets verified to false", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { phoneVerified: true },
			}),
		);

		await t
			.withIdentity(ownerIdentity(user1._id, ins1._id))
			.mutation(api.faculty.updatePhoneNumber, {
				id: facultyId,
				body: { number: "+919999999999" },
			});

		const updated = await t.run((ctx) => ctx.db.get("faculty", facultyId));

		expect(updated?.phone).toEqual({
			number: "+919999999999",
			verified: false,
		});
	});
});

describe("faculty.deactivate", () => {
	it("deactivates a faculty member", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
			}),
		);

		const authed = t.withIdentity(ownerIdentity(user1._id, ins1._id));

		await authed.mutation(api.faculty.deactivate, { id: facultyId });

		const faculty = await authed.query(api.faculty.getById, { id: facultyId });
		expect(faculty.status).toBe("inactive");
	});
});

describe("faculty.activate", () => {
	it("activates a faculty member", async () => {
		const { t, user1, ins1 } = await setupTwoInstitutions();

		const facultyId = await t.run((ctx) =>
			seedFaculty(ctx, {
				institutionId: ins1._id,
				createdBy: user1._id,
				overrides: { status: "inactive" },
			}),
		);

		const authed = t.withIdentity(ownerIdentity(user1._id, ins1._id));

		await authed.mutation(api.faculty.activate, { id: facultyId });

		const faculty = await authed.query(api.faculty.getById, { id: facultyId });
		expect(faculty.status).toBe("active");
	});
});
