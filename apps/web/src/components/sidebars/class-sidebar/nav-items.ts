import {
	IconBook,
	IconCalendarCheck,
	IconSettings,
	IconTable,
	IconUsers,
} from "@tabler/icons-react";

export type ClassNavItem = {
	id: string;
	segment: string;
	icon: typeof IconUsers;
	label: string;
};

export type ClassNavGroup = {
	label: string;
	items: ClassNavItem[];
};

export const classNavGroups: ClassNavGroup[] = [
	{
		label: "CLASS",
		items: [
			{
				id: "students",
				segment: "students",
				icon: IconUsers,
				label: "Students",
			},
			{
				id: "subjects",
				segment: "subjects",
				icon: IconBook,
				label: "Subjects",
			},
			{
				id: "timetable",
				segment: "timetable",
				icon: IconTable,
				label: "Timetable",
			},
			{
				id: "attendance",
				segment: "attendance",
				icon: IconCalendarCheck,
				label: "Attendance",
			},
		],
	},
	{
		label: "CLASS SETTINGS",
		items: [
			{
				id: "settings",
				segment: "settings",
				icon: IconSettings,
				label: "Settings",
			},
		],
	},
];

export function isClassNavActive(
	currentSegment: string | null,
	itemSegment: string,
) {
	if (!currentSegment) return itemSegment === "students";
	return currentSegment === itemSegment;
}
