export type SidePanelState = "palette" | "properties";

export type TimetableSubjectType = "theory" | "practical";

export const TIMETABLE_SUBJECT_TYPE_LABELS: Record<
	TimetableSubjectType,
	string
> = {
	theory: "Theory",
	practical: "Practical",
};

export interface TimetableSubjectOption {
	id: string;
	name: string;
	code?: string;
	color: string;
	type?: TimetableSubjectType;
	/** Default slot duration in hours when dropped from palette. */
	defaultDuration?: number;
}

export interface TimetableBatchOption {
	id: string;
	label: string;
}
