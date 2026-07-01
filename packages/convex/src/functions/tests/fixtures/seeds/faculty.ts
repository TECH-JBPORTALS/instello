import { components } from "../../../_generated/api";
import type { AppMutationCtx } from "../../../model/common.types";
import { type CreateFacultyInput, createFacultyInput } from "../factories";

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
