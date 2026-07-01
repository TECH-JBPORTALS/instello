import { seedPrograms } from "../seeds/programs.seed";
import { institutionTest } from "./institution.setup";

const program = institutionTest().extend(
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
);

export function programTest() {
	return program;
}
