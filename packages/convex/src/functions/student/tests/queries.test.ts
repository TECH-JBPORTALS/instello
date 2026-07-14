import { describe, expect } from "vitest";
import { api } from "@/_generated/api";
import {
	classTest,
	createStudentInput,
	withSlug,
} from "@/__fixtures__/index.setup";

const test = classTest();

describe("student.queries.list", () => {
	test("returns paginated students for a class", async ({
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

		await authed.mutation(
			api.student.mutations.create,
			withSlug(
				ins1,
				createStudentInput(classes.class1._id, categories[0]._id, {
					usn: "1MS21CS002",
					email: "student2@example.com",
				}),
			),
		);

		const result = await authed.query(
			api.student.queries.list,
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
			api.student.mutations.ensureCategories,
			withSlug(ins1, {}),
		);

		await authed.mutation(
			api.student.mutations.create,
			withSlug(ins1, createStudentInput(classes.class2._id, categories[0]._id)),
		);

		const result = await authed.query(
			api.student.queries.list,
			withSlug(ins1, {
				classId: classes.class1._id,
				paginationOpts: { numItems: 10, cursor: null },
			}),
		);

		expect(result.page).toHaveLength(0);
	});
});