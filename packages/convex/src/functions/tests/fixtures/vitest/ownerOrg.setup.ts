import { seedOwnerOrganizations } from "../seeds/ownerOrganizations.seed";
import { ownerTest } from "./owner.setup";

const ownerOrg = ownerTest()
	.extend(
		"ownerOrgs",
		async ({ t, owners }) =>
			await t.run((ctx) => seedOwnerOrganizations(ctx, owners)),
	)
	.extend("ownerOrg1", ({ ownerOrgs }) => ownerOrgs.user1Org)
	.extend("ownerOrg2", ({ ownerOrgs }) => ownerOrgs.user2Org)
	.extend("user1", ({ owners, ownerOrgs: _ownerOrgs }) => owners.user1)
	.extend("user2", ({ owners, ownerOrgs: _ownerOrgs }) => owners.user2)
	.extend(
		"asOwnerUser",
		({ t, ownerOrgs: _ownerOrgs }) =>
			(user: { _id: string }) =>
				t.withIdentity({
					subject: user._id,
					sessionId: "ses-owner",
				}),
	);

export function ownerOrgTest() {
	return ownerOrg;
}
