export * from "./assertions.setup";
export * from "./auth.setup";
export * from "./constants.setup";
export * from "./factories.setup";
export * from "./seeds/classes.seed";
export * from "./seeds/faculty.seed";
export * from "./seeds/institutions.seed";
export * from "./seeds/ownerOrganizations.seed";
export * from "./seeds/owners.seed";
export * from "./seeds/programs.seed";
export * from "./seeds/subjects.seed";
export {
	baseTest,
	classTest,
	institutionTest,
	ownerOrgInstitutionTest,
	ownerOrgTest,
	ownerTest,
	programSubjectTest,
	programTest,
	subjectTest,
} from "./vitest/index.setup";
