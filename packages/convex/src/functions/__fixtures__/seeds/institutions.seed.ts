/** biome-ignore-all lint/style/noNonNullAssertion: <We know that the institutions are not null> */

import { fakerEN_IN as faker } from "@faker-js/faker";
import { components } from "#_generated/api";
import type { AppMutationCtx } from "#model/common.types";
import { FIXED_CREATED_AT } from "../constants.setup";

export type SeededInstitution = {
	_id: string;
	name: string;
	code: string;
	addressLine: string;
	district: string;
	state: string;
	country: string;
	zipCode: string;
	slug: string;
	userId: string;
	createdAt: string;
};

export type SeededInstitutions = {
	user1Primary: SeededInstitution;
	user1Secondary: SeededInstitution;
	user2Primary: SeededInstitution;
	user2Secondary: SeededInstitution;
};

export async function seedInstitutions(
	ctx: AppMutationCtx,
	args: { user1: { _id: string }; user2: { _id: string } },
): Promise<SeededInstitutions> {
	const COUNT = 2;
	faker.seed(123);

	const institutions: SeededInstitution[] = [];

	for (const owner of [args.user1, args.user2]) {
		for (let i = 0; i < COUNT; i++) {
			const name = `${faker.person.firstName()} ${faker.helpers.arrayElement(["Polytechnic", "PU College", "Degree College", "University", "High School", "Engineering College"])}`;
			const slug = faker.helpers.slugify(name).toLowerCase();

			const institution = await ctx.runMutation(
				components.betterAuth.adapter.create,
				{
					input: {
						model: "institution",
						data: {
							name,
							slug,
							addressLine: faker.location.streetAddress(),
							code: faker.number.int({ max: 999 }).toString(),
							country: "India",
							district: faker.location.city(),
							state: faker.location.state(),
							zipCode: faker.location.zipCode(),
							createdAt: FIXED_CREATED_AT,
						},
					},
				},
			);

			await ctx.runMutation(components.betterAuth.adapter.create, {
				input: {
					model: "institutionMember",
					data: {
						organizationId: institution._id,
						userId: owner._id,
						role: "owner",
						createdAt: FIXED_CREATED_AT,
					},
				},
			});

			institutions.push({ ...institution, userId: owner._id });
		}
	}

	return {
		user1Primary: institutions[0]!,
		user1Secondary: institutions[1]!,
		user2Primary: institutions[2]!,
		user2Secondary: institutions[3]!,
	};
}

export async function seedSingleInstitution(
	ctx: AppMutationCtx,
	args: {
		code: string;
		name?: string;
		slug?: string;
	},
) {
	return await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "institution",
			data: {
				name: args.name ?? "Test College",
				slug: args.slug ?? "test-college",
				code: args.code,
				addressLine: "123 Main Street",
				district: "Bangalore Urban",
				state: "Karnataka",
				country: "India",
				zipCode: "560001",
				createdAt: FIXED_CREATED_AT,
			},
		},
	});
}

export function toInstitutionListDto(institution: SeededInstitution) {
	return {
		_id: institution._id,
		name: institution.name,
		code: institution.code,
		addressLine: institution.addressLine,
		district: institution.district,
		state: institution.state,
		country: institution.country,
		zipCode: institution.zipCode,
		slug: institution.slug,
		createdAt: institution.createdAt,
		adoptedPattern: null,
	};
}

export function expectedInstitutionsForUser(
	institutions: SeededInstitutions,
	userId: string,
) {
	return [
		institutions.user1Primary,
		institutions.user1Secondary,
		institutions.user2Primary,
		institutions.user2Secondary,
	]
		.filter((ins) => ins.userId === userId)
		.map(toInstitutionListDto);
}
