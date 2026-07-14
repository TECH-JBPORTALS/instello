import { components } from "#_generated/api";
import type { AppMutationCtx } from "#model/common.types";
import {
	OWNER_1_EMAIL,
	OWNER_1_NAME,
	OWNER_2_EMAIL,
	OWNER_2_NAME,
} from "../constants.setup";

export async function seedOwners(ctx: AppMutationCtx) {
	const user1 = await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: OWNER_1_NAME,
				email: OWNER_1_EMAIL,
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
				name: OWNER_2_NAME,
				email: OWNER_2_EMAIL,
				createdAt: Date.now(),
				emailVerified: true,
				updatedAt: Date.now(),
				role: "owner",
			},
		},
	});

	return { user1, user2 };
}
