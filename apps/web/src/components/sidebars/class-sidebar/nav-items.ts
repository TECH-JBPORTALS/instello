import { IconCalendarCheck, IconTable, IconUsers } from "@tabler/icons-react";

export type ClassNavItem = {
	id: string;
	segment: string;
	icon: typeof IconUsers;
	label: string;
};

export const classNavItems: ClassNavItem[] = [
	{
		id: "students",
		segment: "students",
		icon: IconUsers,
		label: "Students",
	},
	// {
	// 	id: "subjects",
	// 	segment: "subjects",
	// 	icon: IconBook,
	// 	label: "Subjects",
	// },
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
];

export function isClassNavActive(
	currentSegment: string | null,
	itemSegment: string,
) {
	if (!currentSegment) return itemSegment === "students";
	return currentSegment === itemSegment;
}
