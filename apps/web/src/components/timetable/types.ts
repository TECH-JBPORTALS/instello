export type SidePanelTab = "subjects" | "timing";

export type SidePanelState = "palette" | "properties";

export type { TimetableSessionConfig } from "@instello/convex/schedule";

export type TimetableSubjectType = "theory" | "practical";

export const TIMETABLE_SUBJECT_TYPE_LABELS: Record<
	TimetableSubjectType,
	string
> = {
	theory: "Theory",
	practical: "Practical",
};

export interface TimetableSubjectOption {
	/** Unique programSubjects allocation id (palette / drag key). */
	id: string;
	/** subjects table id persisted on timetable slots. */
	subjectId: string;
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
