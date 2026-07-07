import type { TimetableItem } from "@/components/timetable/timetable-display";
import type {
	TimetablePublisher,
	TimetablePublishInfoProps,
	TimetableVersionEntry,
} from "@/components/timetable/timetable-publish-info";

const SUBJECT_COLORS = {
	mathematics: "#3B82F6",
	science: "#F59E0B",
	autoMachinaryLab: "#A855F7",
	itSkillsLab: "#22C55E",
} as const;

const TEACHERS = {
	mathematics: { name: "Srivastav", image: "https://i.pravatar.cc/64?img=12" },
	science: { name: "Swaraswati", image: "https://i.pravatar.cc/64?img=47" },
	autoMachinaryLab: {
		name: "Staff name",
		image: "https://i.pravatar.cc/64?img=33",
	},
	itSkillsLab: { name: "Srivastav", image: "https://i.pravatar.cc/64?img=12" },
} as const;

function mathScienceAutoLabDay(day: number): TimetableItem[] {
	return [
		{
			day,
			startHour: 0,
			endHour: 1,
			subject: "Mathematics",
			color: SUBJECT_COLORS.mathematics,
			teacher: TEACHERS.mathematics,
		},
		{
			day,
			startHour: 1,
			endHour: 2,
			subject: "Science",
			color: SUBJECT_COLORS.science,
			teacher: TEACHERS.science,
		},
		{
			day,
			startHour: 2,
			endHour: 4,
			subject: "Auto Machinary Lab",
			room: "B1",
			color: SUBJECT_COLORS.autoMachinaryLab,
			teacher: TEACHERS.autoMachinaryLab,
		},
		{
			day,
			startHour: 4,
			endHour: 7,
			subject: "IT Skills Lab",
			room: "B1",
			color: SUBJECT_COLORS.itSkillsLab,
			teacher: TEACHERS.itSkillsLab,
		},
		{
			day,
			startHour: 4,
			endHour: 7,
			subject: "IT Skills Lab",
			room: "B2",
			color: SUBJECT_COLORS.itSkillsLab,
			teacher: TEACHERS.itSkillsLab,
		},
	];
}

function labFirstDay(day: number): TimetableItem[] {
	return [
		{
			day,
			startHour: 0,
			endHour: 3,
			subject: "IT Skills Lab",
			room: "B1",
			color: SUBJECT_COLORS.itSkillsLab,
			teacher: TEACHERS.itSkillsLab,
		},
		{
			day,
			startHour: 0,
			endHour: 3,
			subject: "IT Skills Lab",
			room: "B2",
			color: SUBJECT_COLORS.itSkillsLab,
			teacher: TEACHERS.itSkillsLab,
		},
		{
			day,
			startHour: 3,
			endHour: 4,
			subject: "Science",
			color: SUBJECT_COLORS.science,
			teacher: TEACHERS.science,
		},
		{
			day,
			startHour: 4,
			endHour: 5,
			subject: "Mathematics",
			color: SUBJECT_COLORS.mathematics,
			teacher: TEACHERS.mathematics,
		},
		{
			day,
			startHour: 5,
			endHour: 7,
			subject: "Auto Machinary Lab",
			room: "B1",
			color: SUBJECT_COLORS.autoMachinaryLab,
			teacher: TEACHERS.autoMachinaryLab,
		},
	];
}

function saturdayHalfDay(day: number): TimetableItem[] {
	return [
		{
			day,
			startHour: 0,
			endHour: 2,
			subject: "IT Skills Lab",
			room: "B1",
			color: SUBJECT_COLORS.itSkillsLab,
			teacher: TEACHERS.itSkillsLab,
		},
		{
			day,
			startHour: 0,
			endHour: 2,
			subject: "IT Skills Lab",
			room: "B2",
			color: SUBJECT_COLORS.itSkillsLab,
			teacher: TEACHERS.itSkillsLab,
		},
		{
			day,
			startHour: 2,
			endHour: 3,
			subject: "Science",
			color: SUBJECT_COLORS.science,
			teacher: TEACHERS.science,
		},
	];
}

// day: 0 = Monday ... 5 = Saturday
export const CLASS_TIMETABLE_DUMMY_ITEMS: TimetableItem[] = [
	...mathScienceAutoLabDay(0), // Monday
	...labFirstDay(1), // Tuesday
	...mathScienceAutoLabDay(2), // Wednesday
	...labFirstDay(3), // Thursday
	...mathScienceAutoLabDay(4), // Friday
	...saturdayHalfDay(5), // Saturday
];

export const CLASS_TIMETABLE_PUBLISH_INFO: TimetablePublishInfoProps = {
	publisher: {
		name: "Ananya Verma",
		image: "https://i.pravatar.cc/64?img=5",
	},
	message:
		"Swapped Auto Machinary Lab and IT Skills Lab for the Wednesday batch",
	publishedAt: new Date("2026-06-30T09:15:00Z").getTime(),
	currentVersion: 12,
	totalVersions: 12,
};

const ANANYA_VERMA: TimetablePublisher = {
	name: "Ananya Verma",
	image: "https://i.pravatar.cc/64?img=5",
};

const RAJESH_KUMAR: TimetablePublisher = {
	name: "Rajesh Kumar",
	image: "https://i.pravatar.cc/64?img=22",
};

const PRIYA_NAIR: TimetablePublisher = {
	name: "Priya Nair",
	image: "https://i.pravatar.cc/64?img=8",
};

export type { TimetableVersionEntry };

// Newest first, matching CLASS_TIMETABLE_PUBLISH_INFO at v12.
export const CLASS_TIMETABLE_VERSION_HISTORY: TimetableVersionEntry[] = [
	{
		version: 12,
		publisher: ANANYA_VERMA,
		message:
			"Swapped Auto Machinary Lab and IT Skills Lab for the Wednesday batch",
		publishedAt: new Date("2026-06-30T09:15:00Z").getTime(),
	},
	{
		version: 11,
		publisher: RAJESH_KUMAR,
		message: "Added a second IT Skills Lab batch (B2) on Saturday",
		publishedAt: new Date("2026-06-24T11:00:00Z").getTime(),
	},
	{
		version: 10,
		publisher: ANANYA_VERMA,
		message: "Moved Science to the first hour on Tuesday and Thursday",
		publishedAt: new Date("2026-06-18T08:30:00Z").getTime(),
	},
	{
		version: 9,
		publisher: PRIYA_NAIR,
		message:
			"Fixed a clash between Mathematics and Auto Machinary Lab on Friday",
		publishedAt: new Date("2026-06-10T14:45:00Z").getTime(),
	},
	{
		version: 8,
		publisher: ANANYA_VERMA,
		message: "Published the timetable for the new semester",
		publishedAt: new Date("2026-06-02T09:00:00Z").getTime(),
	},
	{
		version: 7,
		publisher: RAJESH_KUMAR,
		message: "Reduced Auto Machinary Lab to a single hour on weekdays",
		publishedAt: new Date("2026-05-26T10:20:00Z").getTime(),
	},
	{
		version: 6,
		publisher: PRIYA_NAIR,
		message: "Rebalanced hours after the mid-semester review",
		publishedAt: new Date("2026-05-18T09:00:00Z").getTime(),
	},
	{
		version: 5,
		publisher: ANANYA_VERMA,
		message: "Initial timetable draft for the semester",
		publishedAt: new Date("2026-05-10T09:00:00Z").getTime(),
	},
];
