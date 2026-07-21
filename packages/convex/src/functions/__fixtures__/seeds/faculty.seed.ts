import { components } from "#_generated/api";
import type { AppMutationCtx } from "#model/common.types";
import {
	type CreateFacultyInput,
	createFacultyInput,
} from "../factories.setup";

export async function seedFaculty(
	ctx: AppMutationCtx,
	args: {
		institutionId: string;
		createdBy: string;
		overrides?: Partial<CreateFacultyInput> & {
			status?: "active" | "inactive" | "draft" | "invited";
			insRole?: "faculty" | "principal";
			userId?: string;
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
		designation: input.designation,
		qualification: input.qualification,
		specialization: input.specialization,
		institutionId: args.institutionId,
		createdBy: args.createdBy,
		phone: {
			number: input.phoneNumber,
			verified: args.overrides?.phoneVerified ?? false,
		},
		status: args.overrides?.status ?? "draft",
		insRole: args.overrides?.insRole ?? "faculty",
		userId: args.overrides?.userId,
		createdAt: now,
		updatedAt: now,
	});
}

export async function seedFacultyMember(
	ctx: AppMutationCtx,
	args: {
		institutionId: string;
		role?: "faculty" | "principal";
		email?: string;
		name?: string;
	},
) {
	const createdAt = Date.now();

	const user = await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: args.name ?? "Faculty Member",
				email: args.email ?? "faculty.member+test@resend.dev",
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
				role: args.role ?? "faculty",
				createdAt,
			},
		},
	});

	return user;
}
