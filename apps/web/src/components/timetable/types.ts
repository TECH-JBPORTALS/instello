export type SidePanelState = "palette" | "properties";

export interface TimetableSubjectOption {
	id: string;
	name: string;
	code?: string;
	color: string;
	/** Default slot duration in hours when dropped from palette. */
	defaultDuration?: number;
}

export interface TimetableBatchOption {
	id: string;
	label: string;
}
