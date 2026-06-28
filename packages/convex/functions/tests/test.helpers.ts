import { fakerEN_IN as faker } from "@faker-js/faker";
import { components } from "../_generated/api";
import type { AppMutationCtx } from "../model/common.types";
import { Id } from "../_generated/dataModel";

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
	const COUNT = 2;

	// Static seed info
	faker.seed(123);

	type Institution = {
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

	const institutions: Institution[] = [];
	const createdAt = Date.now();

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
							createdAt,
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
						createdAt,
					},
				},
			});

			institutions.push({ ...institution, userId: owner._id });
		}
	}

	return institutions;
}

export async function seedPrograms(
	ctx: AppMutationCtx,
	args: {
		user1: { _id: string };
		user2: { _id: string };
		ins1: { _id: string };
		ins2: { _id: string };
	},
) {
	await ctx.db.insert("programs", {
		name: "Mechanical Engineering",
		alias: "ME",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: args.user1._id,
		institutionId: args.ins1._id,
		status: "active",
	});

	await ctx.db.insert("programs", {
		name: "Computer Science",
		alias: "CS",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: args.user1._id,
		institutionId: args.ins1._id,
		status: "active",
	});

	// Should not be returned
	await ctx.db.insert("programs", {
		name: "Civil Engineering",
		alias: "CE",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: args.user2._id,
		institutionId: args.ins2._id,
		status: "active",
	});

	return ctx.db.query("programs").collect();
}

export async function seedClasses(
	ctx: AppMutationCtx,
	args: {
		program1Id: Id<"programs">;
		program2Id: Id<"programs">;
	},
) {
	await ctx.db.insert("classes", {
		programId: args.program1Id,
		name: "Class 1",
		description: "Class 1 description",
		academicYear: 2026,
		semester: 1,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		status: "active",
		isGroupsEnabled: false,
	});

	await ctx.db.insert("classes", {
		programId: args.program1Id,
		name: "Class 2",
		description: "Class 2 description",
		academicYear: 2026,
		semester: 2,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		status: "active",
		isGroupsEnabled: false,
	});

	await ctx.db.insert("classes", {
		programId: args.program2Id,
		name: "Class 3",
		description: "Class 3 description",
		academicYear: 2026,
		semester: 3,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		status: "active",
		isGroupsEnabled: false,
	});

	const program1Classes = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", args.program1Id))
		.collect();

	const program2Classes = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", args.program2Id))
		.collect();

	return { program1Classes, program2Classes };
}
