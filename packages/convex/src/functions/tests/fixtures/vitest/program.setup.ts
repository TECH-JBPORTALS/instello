import { seedInstitutionAcademicPatterns } from "../seeds/institutionAcademicPatterns.seed";
import { seedOwnerOrganizations } from "../seeds/ownerOrganizations.seed";
import { seedPrograms } from "../seeds/programs.seed";
import { institutionTest } from "./institution.setup";

const program = institutionTest()
	.extend(
		"ownerOrgs",
		async ({ t, owners }) =>
			await t.run((ctx) => seedOwnerOrganizations(ctx, owners)),
	)
	.extend(
		"programs",
		async ({ t, owners, ins1, ins2 }) =>
			await t.run((ctx) =>
				seedPrograms(ctx, {
					user1: owners.user1,
					user2: owners.user2,
					ins1,
					ins2,
				}),
			),
	)
	.extend(
		"academicAdoptions",
		async ({ t, ownerOrgs, ins1, ins2 }) =>
			await t.run((ctx) =>
				seedInstitutionAcademicPatterns(ctx, {
					ownerOrg1Id: ownerOrgs.user1Org._id,
					ownerOrg2Id: ownerOrgs.user2Org._id,
					ins1Id: ins1._id,
					ins2Id: ins2._id,
				}),
			),
	);

export function programTest() {
	return program;
}
