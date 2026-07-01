import * as v from "valibot";

export const SYSTEM_TYPE_LABELS = {
	semester: "Semester",
	annual: "Annual",
} as const;

export const SYSTEM_YEARS_LABELS = {
	1: "1 year",
	2: "2 years",
	3: "3 years",
	4: "4 years",
	5: "5 years",
} as const;

export const TEMPLATE_KEY_LABELS = {
	engineering: "Engineering",
	diploma: "Diploma",
} as const;

export type SystemType = keyof typeof SYSTEM_TYPE_LABELS;
export type TemplateKey = keyof typeof TEMPLATE_KEY_LABELS;

export function formatPatternSummary(
	systemType: SystemType,
	durationInYears: number,
	stageCount: number,
) {
	const yearsLabel =
		durationInYears === 1 ? "1 year" : `${durationInYears} years`;
	const stagesLabel = stageCount === 1 ? "1 stage" : `${stageCount} stages`;

	return `${SYSTEM_TYPE_LABELS[systemType]} · ${yearsLabel} · ${stagesLabel}`;
}

export const PatternNameSchema = v.pipe(
	v.string(),
	v.nonEmpty("Pattern name is required"),
);

export const PatternDescriptionSchema = v.string();

export const PatternDurationSchema = v.pipe(
	v.number(),
	v.minValue(1, "Duration must be at least 1 year"),
	v.maxValue(10, "Duration must be at most 10 years"),
);

export const StageNameSchema = v.pipe(
	v.string(),
	v.nonEmpty("Stage name is required"),
);

export const StageAliasSchema = v.pipe(
	v.string(),
	v.nonEmpty("Stage alias is required"),
);

export const PatternMetadataSchema = v.object({
	name: PatternNameSchema,
	description: PatternDescriptionSchema,
});

export const PatternCoreSchema = v.object({
	systemType: v.union([v.literal("semester"), v.literal("annual")]),
	durationInYears: PatternDurationSchema,
});

export const StageMetadataSchema = v.object({
	name: StageNameSchema,
	alias: StageAliasSchema,
});
