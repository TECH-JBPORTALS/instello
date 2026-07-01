import { seedClasses } from "../seeds/classes.seed";
import { programTest } from "./program.setup";

const classLayer = programTest().extend(
	"classes",
	async ({ t, programs, academicAdoptions }) =>
		await t.run((ctx) =>
			seedClasses(ctx, {
				program1Id: programs.me._id,
				program2Id: programs.ce._id,
				program1FirstStageId: academicAdoptions.ins1FirstStage._id,
				program1SecondStageId: academicAdoptions.ins1SecondStage._id,
				program2FirstStageId: academicAdoptions.ins2FirstStage._id,
			}),
		),
);

export function classTest() {
	return classLayer;
}
