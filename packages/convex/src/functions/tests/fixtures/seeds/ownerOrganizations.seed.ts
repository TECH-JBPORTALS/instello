import type { AppMutationCtx } from "../../../model/common.types";
import * as OwnerOrganization from "../../../model/ownerOrganization";

export const OWNER_ORG_1 = {
	name: "Walter White Organization",
	slug: "walter-white-org",
	addressLine: "308 Negra Arroyo Lane",
	city: "Albuquerque",
	state: "New Mexico",
	postalCode: "87104",
	country: "USA",
} as const;

export async function seedOwnerOrganizations(
	ctx: AppMutationCtx,
	args: { user1: { _id: string }; user2: { _id: string } },
) {
	const org1 = await OwnerOrganization.create(ctx, {
		...OWNER_ORG_1,
		ownerId: args.user1._id,
	});

	const org2 = await OwnerOrganization.create(ctx, {
		name: "Rajmatha Organization",
		slug: "rajmatha-org",
		addressLine: "123 Temple Street",
		city: "Chennai",
		state: "Tamil Nadu",
		postalCode: "600001",
		country: "India",
		ownerId: args.user2._id,
	});

	return {
		user1Org: { _id: org1, ...OWNER_ORG_1, ownerId: args.user1._id },
		user2Org: {
			_id: org2,
			name: "Rajmatha Organization",
			slug: "rajmatha-org",
			ownerId: args.user2._id,
		},
	};
}

export function ownerUserIdentity(userId: string) {
	return {
		subject: userId,
		sessionId: "ses-owner",
	};
}
