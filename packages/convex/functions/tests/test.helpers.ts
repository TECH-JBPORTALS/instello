import { fakerEN_IN as faker } from "@faker-js/faker";
import { components } from "../_generated/api";
import { authComponent, createAuth } from "../auth";
import type { AppMutationCtx } from "../model/common.types";

export async function seedOwners(ctx: AppMutationCtx) {
	const user1 = await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: "Walter White",
				email: "walter+test@resend.dev",
				createdAt: Date.now(),
				emailVerified: true,
				updatedAt: Date.now(),
				role: "owner",
			},
		},
	});

	const user2 = await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: "Rajmatha",
				email: "rajmatha+test@resend.dev",
				createdAt: Date.now(),
				emailVerified: true,
				updatedAt: Date.now(),
				role: "owner",
			},
		},
	});

	return { user1, user2 };
}

export async function seedInstitutions(
	ctx: AppMutationCtx,
	args: { user1: { _id: string }; user2: { _id: string } },
) {
	const { auth } = await authComponent.getAuth(createAuth, ctx);

	const COUNT = 2;

	// Static seed info
	faker.seed(123);

	type Institution = { id: string; name: string; slug: string; userId: string };

	const institutions: Institution[] = [];

	for (const owner of [args.user1, args.user2]) {
		for (let i = 0; i < COUNT; i++) {
			const name = `${faker.person.firstName()} ${faker.helpers.arrayElement(["Polytechnic", "PU College", "Degree College", "University", "High School", "Engineering College"])}`;
			const slug = faker.helpers.slugify(name).toLowerCase();

			const institution = await auth.api.createOrganization({
				body: { name, slug, userId: owner._id },
			});

			institutions.push({ ...institution, userId: owner._id });
		}
	}

	return institutions;
}

export async function seedPrograms(
	ctx: AppMutationCtx,
	args: { user1: { _id: string }; user2: { _id: string } },
) {
	await ctx.db.insert("programs", {
		name: "Mechanical Engineering",
		alias: "ME",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: args.user1._id,
		institutionId: "ins-1",
		status: "active",
	});

	await ctx.db.insert("programs", {
		name: "Computer Science",
		alias: "CS",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: args.user1._id,
		institutionId: "ins-1",
		status: "active",
	});

	// Should not be returned
	await ctx.db.insert("programs", {
		name: "Civil Engineering",
		alias: "CE",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: args.user2._id,
		institutionId: "ins-2",
		status: "active",
	});

	return ctx.db.query("programs").collect();
}
