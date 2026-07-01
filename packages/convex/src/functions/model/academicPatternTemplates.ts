export type TemplateKey = "engineering" | "diploma";

export type StageTemplate = {
	name: string;
	alias: string;
	sequenceNumber: number;
	yearNumber: number;
};

export type PatternTemplate = {
	templateKey: TemplateKey;
	name: string;
	description: string;
	systemType: "semester" | "annual";
	durationInYears: number;
	stages: StageTemplate[];
};

function buildSemesterStages(
	years: number,
	semestersPerYear: number,
): StageTemplate[] {
	const stages: StageTemplate[] = [];
	let sequenceNumber = 1;

	for (let year = 1; year <= years; year++) {
		for (let semester = 1; semester <= semestersPerYear; semester++) {
			stages.push({
				name: `Semester ${sequenceNumber}`,
				alias: `s${sequenceNumber}`,
				sequenceNumber,
				yearNumber: year,
			});
			sequenceNumber++;
		}
	}

	return stages;
}

export const DEFAULT_PATTERN_TEMPLATES: PatternTemplate[] = [
	{
		templateKey: "engineering",
		name: "Engineering",
		description: "4-year semester-based engineering program",
		systemType: "semester",
		durationInYears: 4,
		stages: buildSemesterStages(4, 2),
	},
	{
		templateKey: "diploma",
		name: "Diploma",
		description: "3-year semester-based diploma program",
		systemType: "semester",
		durationInYears: 3,
		stages: buildSemesterStages(3, 2),
	},
];
