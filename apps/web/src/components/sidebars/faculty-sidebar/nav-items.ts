import type { Icon } from "@tabler/icons-react";
import { IconCalendarWeek, IconHome } from "@tabler/icons-react";

export type FacultyNavItem = {
	id: string;
	href: string;
	icon: Icon;
	label: string;
};

export const facultyNavItems: FacultyNavItem[] = [
	{ id: "home", href: "/", icon: IconHome, label: "Home" },
	{
		id: "my-timetable",
		href: "/my-timetable",
		icon: IconCalendarWeek,
		label: "My Timetable",
	},
];

export function isFacultyNavActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}
