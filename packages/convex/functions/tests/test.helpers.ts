import { components } from "../_generated/api";
import type { AppMutationCtx } from "../model/common.types";

export async function seedPrograms(ctx: AppMutationCtx) {
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

	await ctx.db.insert("programs", {
		name: "Mechanical Engineering",
		alias: "ME",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: user1._id,
		institutionId: "ins-1",
		status: "active",
	});

	await ctx.db.insert("programs", {
		name: "Computer Science",
		alias: "CS",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: user1._id,
		institutionId: "ins-1",
		status: "active",
	});

	// Should not be returned
	await ctx.db.insert("programs", {
		name: "Civil Engineering",
		alias: "CE",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		createdBy: user2._id,
		institutionId: "ins-2",
		status: "active",
	});

	return ctx.db.query("programs").collect();
}
