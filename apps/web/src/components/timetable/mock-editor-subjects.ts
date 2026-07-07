import type { TimetableBatchOption, TimetableSubjectOption } from "./types";

export const MOCK_EDITOR_SUBJECTS: TimetableSubjectOption[] = [
	{
		id: "alloc-math",
		subjectId: "subj-math",
		name: "Mathematics",
		code: "MATH101",
		color: "#3B82F6",
	},
	{
		id: "alloc-science",
		subjectId: "subj-science",
		name: "Science",
		code: "SCI101",
		color: "#F59E0B",
	},
	{
		id: "alloc-physics",
		subjectId: "subj-physics",
		name: "Engineering Physics",
		code: "PHY101",
		color: "#06B6D4",
	},
	{
		id: "alloc-lab-auto",
		subjectId: "subj-lab-auto",
		name: "Auto Machinery Lab",
		code: "LAB-A",
		color: "#A855F7",
		defaultDuration: 2,
	},
	{
		id: "alloc-lab-it",
		subjectId: "subj-lab-it",
		name: "IT Skills Lab",
		code: "LAB-IT",
		color: "#22C55E",
		defaultDuration: 3,
	},
	{
		id: "alloc-art",
		subjectId: "subj-art",
		name: "Art",
		code: "ART101",
		color: "#EC4899",
	},
];

export const MOCK_EDITOR_BATCHES: TimetableBatchOption[] = [
	{ id: "batch-1", label: "Batch 1" },
	{ id: "batch-2", label: "Batch 2" },
	{ id: "batch-3", label: "Batch 3" },
];
