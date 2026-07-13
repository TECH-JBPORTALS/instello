import type { Icon } from "@tabler/icons-react";
import { IconBook2, IconFlask } from "@tabler/icons-react";

export type SubjectAllocationType = "theory" | "practical";

export const SUBJECT_TYPE_OPTIONS: {
	value: SubjectAllocationType;
	label: string;
	icon: Icon;
}[] = [
	{ value: "theory", label: "Theory", icon: IconBook2 },
	{ value: "practical", label: "Practical", icon: IconFlask },
];

export const SUBJECT_TYPE_LABELS: Record<SubjectAllocationType, string> = {
	theory: "Theory",
	practical: "Practical",
};

export const SUBJECT_TYPE_ICONS: Record<SubjectAllocationType, Icon> = {
	theory: IconBook2,
	practical: IconFlask,
};

export const ACTIVE_STAGE_QUERY_KEY = "stage";
