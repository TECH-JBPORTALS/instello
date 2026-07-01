import { seedClasses } from "../seeds/classes";
import { programTest } from "./program";

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
