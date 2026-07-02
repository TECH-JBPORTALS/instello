import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/constants";
import {
	classTest,
	createStudentInput,
	expectAppError,
	STUDENT_EMAIL,
	STUDENT_USN,
	withSlug,
} from "./fixtures/index.setup";

const test = classTest();

describe("students.ensureCategories", () => {
	test("seeds default categories for an institution", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		const categories = await asOwner(user1, ins1).mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		expect(categories).toHaveLength(16);
		expect(categories.map((category) => category.name)).toEqual([
			"GM",
			"Cat-1",
			"Cat-IIA",
			"Cat-IIB",
			"Cat-IIIA",
			"Cat-IIIB",
			"SC",
			"ST",
			"Rural",
			"Kannada",
			"KK",
			"NCC",
			"PH",
			"Sports",
			"Ex-Army",
			"SNQ",
		]);
	});

	test("is idempotent", async ({ user1, ins1, asOwner }) => {
		const authed = asOwner(user1, ins1);

		await authed.mutation(api.students.ensureCategories, withSlug(ins1, {}));
		const second = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		expect(second).toHaveLength(16);
	});
});

describe("students.create", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		const categoryId = await t.run(async (ctx) => {
			const { seedDefaults, listByInstitution } = await import(
				"../model/institutionStudentCategory"
			);
			await seedDefaults(ctx, ins1._id);
			const categories = await listByInstitution(ctx, ins1._id);
			return categories[0]?._id;
		});

		await expectAppError(
			t.mutation(
				api.students.create,
				withSlug(ins1, createStudentInput(classes.class1._id, categoryId)),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("creates a student with all fields", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const categories = await asOwner(user1, ins1).mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await asOwner(user1, ins1).mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					apaarId: "123456789012",
				}),
			),
		);

		expect(studentId).toBeDefined();

		const student = await asOwner(user1, ins1).query(
			api.students.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student).toMatchObject({
			firstName: "Rahul",
			lastName: "Kumar",
			usn: STUDENT_USN,
			email: STUDENT_EMAIL,
			gender: "male",
			categoryName: "GM",
			phoneNumber: "9876543210",
			apaarId: "123456789012",
			classId: classes.class1._id,
		});
	});

	test("rejects duplicate USN", async ({ user1, ins1, classes, asOwner }) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await expectAppError(
			authed.mutation(
				api.students.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						email: "other@example.com",
					}),
				),
			),
			ERROR_CODES.STUDENT.USN_ALREADY_EXISTS,
		);
	});

	test("rejects duplicate email within institution", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await expectAppError(
			authed.mutation(
				api.students.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						usn: "1MS21CS002",
					}),
				),
			),
			ERROR_CODES.STUDENT.EMAIL_ALREADY_EXISTS,
		);
	});

	test("rejects invalid APAAR ID", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const categories = await asOwner(user1, ins1).mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.students.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						apaarId: "12345",
					}),
				),
			),
			ERROR_CODES.STUDENT.INVALID_APAAR_ID,
		);
	});

	test("allows same email in different institutions", async ({
		user1,
		user2,
		ins1,
		ins2,
		classes,
		asOwner,
	}) => {
		const categories1 = await asOwner(user1, ins1).mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);
		const categories2 = await asOwner(user2, ins2).mutation(
			api.students.ensureCategories,
			withSlug(ins2, {}),
		);

		const id1 = await asOwner(user1, ins1).mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories1[0]._id),
			),
		);

		const id2 = await asOwner(user2, ins2).mutation(
			api.students.create,
			withSlug(
				ins2,
				createStudentInput(classes.class3._id, categories2[0]._id, {
					usn: "2MS21CS001",
				}),
			),
		);

		expect(id1).toBeDefined();
		expect(id2).toBeDefined();
		expect(id1).not.toEqual(id2);
	});
});

describe("students.list", () => {
	test("returns paginated students for a class", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await authed.mutation(
			api.students.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS002",
					email: "student2@example.com",
				}),
			),
		);

		const result = await authed.query(
			api.students.list,
			withSlug(ins1, {
				classId: classes.class1._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(2);
		expect(result.isDone).toBe(true);
	});

	test("does not return students from other classes", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class2._id, categories[0]._id)),
		);

		const result = await authed.query(
			api.students.list,
			withSlug(ins1, {
				classId: classes.class1._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(0);
	});
});

describe("students.updatePersonalInfo", () => {
	test("updates student personal info", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.students.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.students.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await authed.mutation(
			api.students.updatePersonalInfo,
			withSlug(ins1, {
				id: studentId,
				body: { firstName: "Updated", gender: "female" },
			}),
		);

		const student = await authed.query(
			api.students.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.firstName).toBe("Updated");
		expect(student.gender).toBe("female");
	});
});
