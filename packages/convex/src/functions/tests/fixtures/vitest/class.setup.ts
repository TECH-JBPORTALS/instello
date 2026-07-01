import { seedClasses } from "../seeds/classes.seed";
import { programTest } from "./program.setup";

const classLayer = programTest().extend(
	"classes",
	async ({ t, programs }) =>
		await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: programs.me._id,
				program2Id: programs.ce._id,
			}),
		),
);

export function classTest() {
	return classLayer;
}
