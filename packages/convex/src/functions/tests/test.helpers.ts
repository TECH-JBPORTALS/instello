import { fakerEN_IN as faker } from "@faker-js/faker";
import { expect } from "vitest";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { AppErrorCode } from "../helpers/constants";
import type { AppMutationCtx } from "../model/common.types";
import { createTest } from "./test.setup";

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

export const FACULTY_EMAIL = "jane.doe@example.com";
export const FACULTY_PHONE = "+919876543210";
export const FACULTY_STAFF_ID = "STAFF-001";

export const createFacultyInput = () => ({
	staffId: FACULTY_STAFF_ID,
	firstName: "Jane",
	lastName: "Doe",
	dateOfBirth: "1990-05-15",
	email: FACULTY_EMAIL,
	profilePicUrl: "https://example.com/pic.jpg",
	designation: "Professor",
	qualification: "Ph.D.",
	specialization: "Computer Science",
	phoneNumber: FACULTY_PHONE,
});

export type CreateFacultyInput = ReturnType<typeof createFacultyInput>;

export async function seedFaculty(
	ctx: AppMutationCtx,
	args: {
		institutionId: string;
		createdBy: string;
		overrides?: Partial<CreateFacultyInput> & {
			status?: "active" | "inactive";
			phoneVerified?: boolean;
		};
	},
) {
	const input = { ...createFacultyInput(), ...args.overrides };
	const now = Date.now();

	return await ctx.db.insert("faculty", {
		staffId: input.staffId,
		firstName: input.firstName,
		lastName: input.lastName,
		dateOfBirth: input.dateOfBirth,
		email: input.email,
		profilePicUrl: input.profilePicUrl,
		designation: input.designation,
		qualification: input.qualification,
		specialization: input.specialization,
		institutionId: args.institutionId,
		createdBy: args.createdBy,
		phone: {
			number: input.phoneNumber,
			verified: args.overrides?.phoneVerified ?? false,
		},
		status: args.overrides?.status ?? "active",
		createdAt: now,
		updatedAt: now,
	});
}

export async function seedFacultyMember(
	ctx: AppMutationCtx,
	args: { institutionId: string },
) {
	const createdAt = Date.now();

	const user = await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: "Faculty Member",
				email: "faculty.member+test@resend.dev",
				createdAt,
				emailVerified: true,
				updatedAt: createdAt,
				role: "user",
			},
		},
	});

	await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "institutionMember",
			data: {
				organizationId: args.institutionId,
				userId: user._id,
				role: "faculty",
				createdAt,
			},
		},
	});

	return user;
}

export function ownerIdentity(userId: string, institutionId: string) {
	return {
		subject: userId,
		activeInstitutionId: institutionId,
		sessionId: "ses-owner",
	};
}

export function withSlug<T extends Record<string, unknown>>(
	institution: { slug: string },
	args: T,
): T & { slug: string } {
	return { slug: institution.slug, ...args };
}

/** First institution per owner from {@link seedInstitutions} (user1's primary). */
export function primaryIns<T extends { _id: string; slug: string }>(
	institutions: T[],
): T {
	return institutions[0];
}

/** Second owner's primary institution from {@link seedInstitutions}. */
export function secondaryIns<T extends { _id: string; slug: string }>(
	institutions: T[],
): T {
	return institutions[2];
}

export async function setupTwoInstitutions() {
	const t = createTest();
	const { user1, user2 } = await t.run(seedOwners);
	const institutions = await t.run((ctx) =>
		seedInstitutions(ctx, { user1, user2 }),
	);

	return {
		t,
		user1,
		user2,
		ins1: institutions[0],
		ins2: institutions[2],
	};
}

export async function expectAppError(
	promise: Promise<unknown>,
	expected: AppErrorCode,
) {
	await expect(promise).rejects.toMatchObject({
		data: {
			code: expected.code,
			message: expected.message,
		},
	});
}
