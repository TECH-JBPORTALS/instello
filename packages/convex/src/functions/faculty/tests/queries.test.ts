import { describe, expect } from "vitest";
import { api } from "@/_generated/api";
import { ERROR_CODES } from "@/helpers/constants";
import {
	expectAppError,
	FACULTY_EMAIL,
	institutionTest,
	seedFaculty,
	withSlug,
} from "@/__fixtures__/index.setup";

const test = institutionTest();

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
			api.faculty.queries.list,
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
			api.faculty.queries.list,
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
			api.faculty.queries.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 2, cursor: null },
			}),
		);

		expect(firstPage.page).toHaveLength(2);
		expect(firstPage.isDone).toBe(false);
		expect(firstPage.page.map((f) => f.staffId)).toEqual([
			"STAFF-0",
			"STAFF-1",
		]);

		const secondPage = await asOwner(user1, ins1).query(
			api.faculty.queries.list,
			withSlug(ins1, {
				paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
			}),
		);

		expect(secondPage.page).toHaveLength(1);
		expect(secondPage.isDone).toBe(true);
		expect(secondPage.page[0]?.staffId).toBe("STAFF-2");
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
			api.faculty.queries.getById,
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
				api.faculty.queries.getById,
				withSlug(ins1, { id: facultyId }),
			),
			ERROR_CODES.FACULTY.NOT_FOUND,
		);
	});
});
