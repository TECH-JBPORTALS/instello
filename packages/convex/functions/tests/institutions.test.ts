import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import { seedInstitutions, seedOwners } from "./test.helpers";
import { createTest } from "./test.setup";

describe("institutions.listMyOwned", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		await expect(t.query(api.institutions.listMyOwned)).rejects.toThrow(
			ERROR_CODES.BASE.UNAUTHORIZED.message,
		);
	});

	it("lists all institutions owned by current user", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);

		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const expectedUser1Institutions = institutions
			.filter((ins) => ins.userId === user1._id)
			.map((ins) => ({
				_id: ins._id,
				name: ins.name,
				slug: ins.slug,
				createdAt: ins.createdAt,
			}));

		const myInstitutions = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.institutions.listMyOwned);

		expect(myInstitutions).toHaveLength(expectedUser1Institutions.length);
		expect(myInstitutions).toEqual(expectedUser1Institutions);
	});

	it("doesn't lists another person's institutions", async () => {
		const t = createTest();

		const { user1, user2 } = await t.run(seedOwners);

		const institutions = await t.run((ctx) =>
			seedInstitutions(ctx, { user1, user2 }),
		);

		const expectedUser2Institutions = institutions
			.filter((ins) => ins.userId === user2._id)
			.map((ins) => ({
				_id: ins._id,
				name: ins.name,
				slug: ins.slug,
				createdAt: ins.createdAt,
			}));

		const myInstitutions = await t
			.withIdentity({
				subject: user2._id,
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.institutions.listMyOwned);

		expect(myInstitutions).toHaveLength(expectedUser2Institutions.length);
		expect(myInstitutions).toEqual(expectedUser2Institutions);
	});
});
