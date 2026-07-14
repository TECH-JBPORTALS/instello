import { ownerIdentity } from "../auth.setup";
import { seedInstitutions } from "../seeds/institutions.seed";
import { ownerTest } from "./owner.setup";

const institution = ownerTest()
	.extend(
		"institutions",
		async ({ t, owners }) =>
			await t.run((ctx) => seedInstitutions(ctx, owners)),
	)
	.extend("ins1", ({ institutions }) => institutions.user1Primary)
	.extend("ins2", ({ institutions }) => institutions.user2Primary)
	.extend(
		"asOwner",
		({ t }) =>
			(user: { _id: string }, ins: { _id: string }) =>
				t.withIdentity(ownerIdentity(user._id, ins._id)),
	);

export function institutionTest() {
	return institution;
}
