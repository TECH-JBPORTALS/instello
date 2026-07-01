/** Built-in template keys seeded for new owner organizations. */
export type TemplateKey = "engineering" | "diploma";

/** Default stage shape used when creating or resyncing pattern stages. */
export type StageTemplate = {
	name: string;
	alias: string;
	sequenceNumber: number;
	yearNumber: number;
};

/** Full default pattern definition used during owner-org seeding. */
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

function buildAnnualStages(years: number): StageTemplate[] {
	const stages: StageTemplate[] = [];

	for (let year = 1; year <= years; year++) {
		stages.push({
			name: `Year ${year}`,
			alias: `y${year}`,
			sequenceNumber: year,
			yearNumber: year,
		});
	}

	return stages;
}

/**
 * Builds the default stage list for a pattern from its system type and duration.
 * Semester patterns use two stages per year; annual patterns use one per year.
 */
export function buildStagesForPattern(
	systemType: "semester" | "annual",
	durationInYears: number,
): StageTemplate[] {
	if (systemType === "annual") {
		return buildAnnualStages(durationInYears);
	}

	return buildSemesterStages(durationInYears, 2);
}

/** Default engineering and diploma patterns created for every owner organization. */
export const DEFAULT_PATTERN_TEMPLATES: PatternTemplate[] = [
	{
		templateKey: "engineering",
		name: "Engineering",
		description: "4-year semester-based engineering program",
		systemType: "semester",
		durationInYears: 4,
		stages: buildStagesForPattern("semester", 4),
	},
	{
		templateKey: "diploma",
		name: "Diploma",
		description: "3-year semester-based diploma program",
		systemType: "semester",
		durationInYears: 3,
		stages: buildStagesForPattern("semester", 3),
	},
];
