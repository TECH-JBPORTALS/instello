import { seedSubjects } from "../seeds/subjects.seed";
import { institutionTest } from "./institution.setup";

const subject = institutionTest().extend(
	"subjects",
	async ({ t, ins1, ins2 }) =>
		await t.run((ctx) =>
			seedSubjects(ctx, {
				ins1,
				ins2,
			}),
		),
);

export function subjectTest() {
	return subject;
}
