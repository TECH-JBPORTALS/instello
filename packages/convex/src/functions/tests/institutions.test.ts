import { describe, expect, it } from "vitest";
import { api, components } from "../_generated/api";
import { ERROR_CODES } from "../helpers/errors";
import { expectAppError, seedInstitutions, seedOwners } from "./test.helpers";
import { createTest } from "./test.setup";

describe("institutions.listMyOwned", () => {
	it("rejects unthencticated user", async () => {
		const t = createTest();

		await expectAppError(
			t.query(api.institutions.listMyOwned),
			ERROR_CODES.BASE.UNAUTHORIZED,
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
				code: ins.code,
				addressLine: ins.addressLine,
				district: ins.district,
				state: ins.state,
				country: ins.country,
				zipCode: ins.zipCode,
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
				code: ins.code,
				addressLine: ins.addressLine,
				district: ins.district,
				state: ins.state,
				country: ins.country,
				zipCode: ins.zipCode,
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

describe("institutions.checkCode", () => {
	it("rejects unauthenticated user", async () => {
		const t = createTest();

		await expectAppError(
			t.query(api.institutions.checkCode, { code: "364" }),
			ERROR_CODES.BASE.UNAUTHORIZED,
		);
	});

	it("returns available when code is not taken", async () => {
		const t = createTest();
		const { user1 } = await t.run(seedOwners);

		const result = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.institutions.checkCode, { code: "unique-code-123" });

		expect(result).toEqual({ available: true });
	});

	it("returns unavailable when code already exists", async () => {
		const t = createTest();
		const { user1 } = await t.run(seedOwners);
		const code = "364";

		await t.run(async (ctx) => {
			await ctx.runMutation(components.betterAuth.adapter.create, {
				input: {
					model: "institution",
					data: {
						name: "Test College",
						slug: "test-college",
						code,
						addressLine: "123 Main Street",
						district: "Bangalore Urban",
						state: "Karnataka",
						country: "India",
						zipCode: "560001",
						createdAt: Date.now(),
					},
				},
			});
		});

		const result = await t
			.withIdentity({
				subject: user1._id,
				activeInstitutionId: "ins-1",
				sessionId: "ses-1",
			})
			.query(api.institutions.checkCode, { code });

		expect(result).toEqual({ available: false });
	});
});
