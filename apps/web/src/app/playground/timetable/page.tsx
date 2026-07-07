"use client";

import { nanoid } from "nanoid";
import Container from "@/components/common/container";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import {
	MOCK_EDITOR_BATCHES,
	MOCK_EDITOR_SUBJECTS,
} from "@/components/timetable/mock-editor-subjects";
import { TimetableEditorShell } from "@/components/timetable/timetable";
import { useTimetableEditor } from "@/components/timetable/use-timetable-editor";

const INITIAL_DATA: HourSpan[] = [
	{
		id: nanoid(),
		day: 0,
		start: 0,
		end: 1,
		subjectId: "subj-math",
		subject: "Math",
		room: "101",
		notes: "",
		color: "#3B82F6",
	},
	{
		id: nanoid(),
		day: 0,
		start: 2,
		end: 4,
		subjectId: "subj-lab-auto",
		subject: "Lab",
		room: "B1",
		notes: "",
		color: "#A855F7",
	},
	{
		id: nanoid(),
		day: 1,
		start: 0,
		end: 2,
		subjectId: "subj-science",
		subject: "Science",
		room: "102",
		notes: "",
		color: "#F59E0B",
	},
	{
		id: nanoid(),
		day: 1,
		start: 4,
		end: 5,
		subjectId: "subj-physics",
		subject: "PE",
		room: "Gym",
		notes: "",
		color: "#EF4444",
	},
	{
		id: nanoid(),
		day: 2,
		start: 4,
		end: 7,
		subjectId: "subj-lab-it",
		subject: "History",
		room: "103",
		notes: "",
		color: "#22C55E",
	},
	{
		id: nanoid(),
		day: 3,
		start: 5,
		end: 6,
		subjectId: "subj-art",
		subject: "Art",
		room: "105",
		notes: "",
		color: "#EC4899",
	},
];

export default function Page() {
	const editor = useTimetableEditor({
		initialSpans: INITIAL_DATA,
		subjects: MOCK_EDITOR_SUBJECTS,
		batches: MOCK_EDITOR_BATCHES,
	});

	return (
		<Container>
			<TimetableEditorShell editor={editor} />
		</Container>
	);
}
