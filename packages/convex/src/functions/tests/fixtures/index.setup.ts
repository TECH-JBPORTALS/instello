export * from "./assertions.setup";
export * from "./auth.setup";
export * from "./constants.setup";
export * from "./factories.setup";
export * from "./seeds/classes.seed";
export * from "./seeds/faculty.seed";
export * from "./seeds/institutions.seed";
export * from "./seeds/owners.seed";
export * from "./seeds/programs.seed";
export {
	baseTest,
	classTest,
	institutionTest,
	ownerTest,
	programTest,
} from "./vitest/index.setup";
