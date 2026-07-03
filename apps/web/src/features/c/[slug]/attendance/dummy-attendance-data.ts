export type AttendanceRegisterType = "theory" | "practical";

export interface AttendanceRegisterActivity {
	actor: { name: string; image?: string };
	description: string;
	updatedAt: number; // epoch ms
}

export interface AttendanceRegisterMock {
	id: string;
	subjectName: string;
	subjectColor: string;
	subjectCode: string;
	type: AttendanceRegisterType;
	batchLabel?: string;
	activity: AttendanceRegisterActivity;
}

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-07-03T08:30:00Z").getTime();

export const CLASS_ATTENDANCE_REGISTERS_MOCK: AttendanceRegisterMock[] = [
	{
		id: "mathematics",
		subjectName: "Mathematics",
		subjectColor: "#3B82F6",
		subjectCode: "15CS1902T",
		type: "theory",
		activity: {
			actor: { name: "Jcob miller", image: "https://i.pravatar.cc/64?img=14" },
			description: "Marked attendance for H3-H4 class",
			updatedAt: now - 2 * DAY,
		},
	},
	{
		id: "science",
		subjectName: "Science",
		subjectColor: "#F59E0B",
		subjectCode: "15CS1904T",
		type: "theory",
		activity: {
			actor: { name: "Srivastav", image: "https://i.pravatar.cc/64?img=12" },
			description: "Edited 3 student records of H1-H3 class in 3 May, 2026",
			updatedAt: now - 2 * DAY,
		},
	},
	{
		id: "it-skills-lab-b01",
		subjectName: "IT Skills Lab",
		subjectColor: "#22C55E",
		subjectCode: "15CS1808P",
		type: "practical",
		batchLabel: "B01",
		activity: {
			actor: { name: "Bhargav", image: "https://i.pravatar.cc/64?img=33" },
			description: "Marked attendance for H3-H4 class",
			updatedAt: now - 2 * DAY,
		},
	},
	{
		id: "it-skills-lab-b02",
		subjectName: "IT Skills Lab",
		subjectColor: "#22C55E",
		subjectCode: "15CS1808P",
		type: "practical",
		batchLabel: "B02",
		activity: {
			actor: { name: "Leelavathi", image: "https://i.pravatar.cc/64?img=45" },
			description: "Marked attendance for H3-H4 class",
			updatedAt: now - 2 * DAY,
		},
	},
	{
		id: "auto-machinary",
		subjectName: "Auto Machinary",
		subjectColor: "#A855F7",
		subjectCode: "15CS1902T",
		type: "theory",
		activity: {
			actor: { name: "Kanaka", image: "https://i.pravatar.cc/64?img=25" },
			description: "Marked attendance for H3-H4 class",
			updatedAt: now - 2 * DAY,
		},
	},
];
