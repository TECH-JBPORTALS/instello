export type AttendanceSessionStatus =
	| "upcoming"
	| "ongoing"
	| "completed"
	| "missed";

export interface AttendanceSessionActor {
	name: string;
	image?: string;
}

export interface AttendanceSessionMock {
	id: string;
	hourLabel: string;
	timeRange: string;
	status: AttendanceSessionStatus;
	actor: AttendanceSessionActor;
	description: string;
	stats?: string;
	updatedAt?: number;
}

export interface AttendanceSessionDateGroup {
	id: string;
	label: string;
	sessions: AttendanceSessionMock[];
}

const JCOB_MILLER: AttendanceSessionActor = {
	name: "Jcob miller",
	image: "https://i.pravatar.cc/64?img=14",
};

const SRIVASTAV: AttendanceSessionActor = {
	name: "Srivastav",
	image: "https://i.pravatar.cc/64?img=12",
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = new Date("2026-07-03T14:00:00Z").getTime();

export const CLASS_ATTENDANCE_SESSION_GROUPS: AttendanceSessionDateGroup[] = [
	{
		id: "today",
		label: "Today",
		sessions: [
			{
				id: "today-hour-7",
				hourLabel: "Hour 7",
				timeRange: "4:00pm to 5:00pm",
				status: "upcoming",
				actor: SRIVASTAV,
				description: "is gonna take this class",
			},
			{
				id: "today-hour-5",
				hourLabel: "Hour 5",
				timeRange: "2:00pm to 3:00pm",
				status: "upcoming",
				actor: SRIVASTAV,
				description: "is gonna take this class",
			},
			{
				id: "today-hour-1-2",
				hourLabel: "Hour 1 - Hour 2",
				timeRange: "9:30am to 11:30am",
				status: "ongoing",
				actor: JCOB_MILLER,
				description: "in the class",
			},
		],
	},
	{
		id: "yesterday",
		label: "Yesterday",
		sessions: [
			{
				id: "yesterday-hour-1-2",
				hourLabel: "Hour 1 - Hour 2",
				timeRange: "9:30am to 11:30am",
				status: "completed",
				actor: JCOB_MILLER,
				description: "Marked attendance 1 day ago",
				stats: "25/50 (50%)",
				updatedAt: now - 3 * HOUR,
			},
			{
				id: "yesterday-h4",
				hourLabel: "H4",
				timeRange: "12:30pm to 1:30pm",
				status: "missed",
				actor: SRIVASTAV,
				description: "likely forgot to marked the attendance",
			},
		],
	},
	{
		id: "13th-jun-thursday",
		label: "13th Jun, Thursday",
		sessions: [
			{
				id: "13th-jun-hour-1-2-a",
				hourLabel: "Hour 1 - Hour 2",
				timeRange: "9:30am to 11:30am",
				status: "completed",
				actor: JCOB_MILLER,
				description: "Marked attendance 3 days ago",
				stats: "15/50 (25%)",
				updatedAt: now - 1 * DAY,
			},
			{
				id: "13th-jun-hour-1-2-b",
				hourLabel: "Hour 1 - Hour 2",
				timeRange: "9:30am to 11:30am",
				status: "completed",
				actor: JCOB_MILLER,
				description: "Marked attendance 3 days ago",
				stats: "10/50 (15%)",
				updatedAt: now - 1 * DAY,
			},
		],
	},
	{
		id: "12th-jun-wednesday",
		label: "12th Jun, Wednesday",
		sessions: [
			{
				id: "12th-jun-hour-1-2",
				hourLabel: "Hour 1 - Hour 2",
				timeRange: "9:30am to 11:30am",
				status: "completed",
				actor: JCOB_MILLER,
				description: "Marked attendance 4 days ago",
				stats: "5/50 (10%)",
				updatedAt: now - 2 * DAY,
			},
		],
	},
];
