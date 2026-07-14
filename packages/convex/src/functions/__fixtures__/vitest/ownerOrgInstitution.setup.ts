import { seedInstitutions } from "../seeds/institutions.seed";
import { ownerOrgTest } from "./ownerOrg.setup";

const ownerOrgInstitution = ownerOrgTest()
	.extend(
		"institutions",
		async ({ t, owners }) =>
			await t.run((ctx) => seedInstitutions(ctx, owners)),
	)
	.extend("ins1", ({ institutions }) => institutions.user1Primary)
	.extend("ins2", ({ institutions }) => institutions.user2Primary)
	.extend("user1", ({ owners, ownerOrgs: _ownerOrgs }) => owners.user1)
	.extend("user2", ({ owners, ownerOrgs: _ownerOrgs }) => owners.user2);

export function ownerOrgInstitutionTest() {
	return ownerOrgInstitution;
}
