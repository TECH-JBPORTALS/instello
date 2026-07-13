import { describe, expect } from "vitest";
import { api } from "../../_generated/api";
import { ERROR_CODES } from "../../helpers/constants";
import {
	classTest,
	createStudentInput,
	expectAppError,
	STUDENT_EMAIL,
	STUDENT_USN,
	withSlug,
} from "../../tests/fixtures/index.setup";

const test = classTest();

describe("student.mutations.ensureCategories", () => {
	test("seeds default categories for an institution", async ({
		user1,
		ins1,
		asOwner,
	}) => {
		const categories = await asOwner(user1, ins1).mutation(
			api.student.mutations.ensureCategories,
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

		await authed.mutation(api.student.mutations.ensureCategories, withSlug(ins1, {}));
		const second = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		expect(second).toHaveLength(16);
	});
});

describe("student.mutations.create", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		const categoryId = await t.run(async (ctx) => {
			const { seedDefaults, listByInstitution } = await import(
				"../../institution/model/studentCategory"
			);
			await seedDefaults(ctx, ins1._id);
			const categories = await listByInstitution(ctx, ins1._id);
			return categories[0]?._id;
		});

		await expectAppError(
			t.mutation(
				api.student.mutations.create,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await asOwner(user1, ins1).mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					apaarId: "123456789012",
				}),
			),
		);

		expect(studentId).toBeDefined();

		const student = await asOwner(user1, ins1).query(
			api.student.queries.getById,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await expectAppError(
			authed.mutation(
				api.student.mutations.create,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await expectAppError(
			authed.mutation(
				api.student.mutations.create,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.student.mutations.create,
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

	test("creates a student with family and address info", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const categories = await asOwner(user1, ins1).mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await asOwner(user1, ins1).mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					fatherName: "Suresh Kumar",
					fatherPhoneNumber: "9876543211",
					motherName: "Lakshmi Kumar",
					motherPhoneNumber: "9876543212",
					addressLine: "123 MG Road",
					city: "Bengaluru",
					state: "Karnataka",
					postalCode: "560001",
				}),
			),
		);

		const student = await asOwner(user1, ins1).query(
			api.student.queries.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student).toMatchObject({
			fatherName: "Suresh Kumar",
			fatherPhoneNumber: "9876543211",
			motherName: "Lakshmi Kumar",
			motherPhoneNumber: "9876543212",
			addressLine: "123 MG Road",
			city: "Bengaluru",
			state: "Karnataka",
			postalCode: "560001",
			country: "India",
		});
	});

	test("rejects invalid father phone number", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const categories = await asOwner(user1, ins1).mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await expectAppError(
			asOwner(user1, ins1).mutation(
				api.student.mutations.create,
				withSlug(
					ins1,
					createStudentInput(classes.class1._id, categories[0]._id, {
						fatherPhoneNumber: "12345",
					}),
				),
			),
			ERROR_CODES.BASE.INVALID_PHONE,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);
		const categories2 = await asOwner(user2, ins2).mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins2, {}),
		);

		const id1 = await asOwner(user1, ins1).mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories1[0]._id),
			),
		);

		const id2 = await asOwner(user2, ins2).mutation(
			api.student.mutations.create,
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


describe("student.mutations.updatePersonalInfo", () => {
	test("updates student personal info", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await authed.mutation(
			api.student.mutations.updatePersonalInfo,
			withSlug(ins1, {
				id: studentId,
				body: { firstName: "Updated", gender: "female" },
			}),
		);

		const student = await authed.query(
			api.student.queries.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.firstName).toBe("Updated");
		expect(student.gender).toBe("female");
	});
});

describe("student.mutations.updateFamilyInfo", () => {
	test("updates family and address info", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await authed.mutation(
			api.student.mutations.updateFamilyInfo,
			withSlug(ins1, {
				id: studentId,
				body: {
					fatherName: "Suresh Kumar",
					motherName: "Lakshmi Kumar",
					addressLine: "123 MG Road",
					city: "Bengaluru",
					state: "Karnataka",
					postalCode: "560001",
				},
			}),
		);

		const student = await authed.query(
			api.student.queries.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student).toMatchObject({
			fatherName: "Suresh Kumar",
			motherName: "Lakshmi Kumar",
			addressLine: "123 MG Road",
			city: "Bengaluru",
			state: "Karnataka",
			postalCode: "560001",
			country: "India",
		});
	});

	test("rejects invalid mother phone number", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class1._id, categories[0]._id)),
		);

		await expectAppError(
			authed.mutation(
				api.student.mutations.updateFamilyInfo,
				withSlug(ins1, {
					id: studentId,
					body: { motherPhoneNumber: "12345" },
				}),
			),
			ERROR_CODES.BASE.INVALID_PHONE,
		);
	});
});

describe("student.mutations.bulkMove", () => {
	test("requires authentication", async ({ t, ins1, classes }) => {
		await expectAppError(
			t.mutation(
				api.student.mutations.bulkMove,
				withSlug(ins1, {
					studentIds: [],
					targetClassId: classes.class2._id,
				}),
			),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	test("moves a student into a batch of another class", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);
		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS300",
					email: "move-student@example.com",
				}),
			),
		);

		const targetBatches = await authed.query(
			api.class.queries.listBatches,
			withSlug(ins1, { classId: classes.class2._id }),
		);
		const targetBatch = targetBatches[0];

		await authed.mutation(
			api.student.mutations.bulkMove,
			withSlug(ins1, {
				studentIds: [studentId],
				targetClassId: classes.class2._id,
				targetBatchId: targetBatch._id,
			}),
		);

		const student = await authed.query(
			api.student.queries.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.classId).toBe(classes.class2._id);
		expect(student.batchId).toBe(targetBatch._id);
		expect(student.batchLabel).toBe(targetBatch.label);
	});

	test("moves a student into a class without batches and clears batchId", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS301",
					email: "move-student2@example.com",
				}),
			),
		);

		await authed.mutation(
			api.student.mutations.bulkMove,
			withSlug(ins1, {
				studentIds: [studentId],
				targetClassId: classes.class2._id,
			}),
		);

		const student = await authed.query(
			api.student.queries.getById,
			withSlug(ins1, { id: studentId }),
		);

		expect(student.classId).toBe(classes.class2._id);
		expect(student.batchId).toBeUndefined();
		expect(student.batchLabel).toBeUndefined();
	});

	test("rejects moving into a batch-enabled class without a targetBatchId", async ({
		user1,
		ins1,
		classes,
		asOwner,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class1._id }),
		);
		await authed.mutation(
			api.class.mutations.enableSectionGroups,
			withSlug(ins1, { id: classes.class2._id }),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS302",
					email: "move-student3@example.com",
				}),
			),
		);

		await expectAppError(
			authed.mutation(
				api.student.mutations.bulkMove,
				withSlug(ins1, {
					studentIds: [studentId],
					targetClassId: classes.class2._id,
				}),
			),
			ERROR_CODES.CLASS.BATCH_REQUIRED,
		);
	});

	test("rejects an unknown student", async ({
		user1,
		ins1,
		classes,
		asOwner,
		t,
	}) => {
		const authed = asOwner(user1, ins1);
		const categories = await authed.mutation(
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		const studentId = await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS303",
					email: "move-student4@example.com",
				}),
			),
		);

		await t.run(async (ctx) => {
			await ctx.db.delete("students", studentId);
		});

		await expectAppError(
			authed.mutation(
				api.student.mutations.bulkMove,
				withSlug(ins1, {
					studentIds: [studentId],
					targetClassId: classes.class2._id,
				}),
			),
			ERROR_CODES.STUDENT.NOT_FOUND,
		);
	});
});