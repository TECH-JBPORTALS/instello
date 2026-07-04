import { seedSubjects } from "../seeds/subjects.seed";
import { programTest } from "./program.setup";

const programSubject = programTest().extend(
	"subjects",
	async ({ t, ins1, ins2 }) =>
		await t.run((ctx) => seedSubjects(ctx, { ins1, ins2 })),
);

export function programSubjectTest() {
	return programSubject;
}
