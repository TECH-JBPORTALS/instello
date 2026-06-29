import type { Icon } from "@tabler/icons-react";
import {
	IconBox,
	IconCalendar,
	IconCalendarCheck,
	IconCopy,
	IconSchool,
	IconUser,
} from "@tabler/icons-react";

export type NavItem = {
	id: string;
	href: string;
	icon: Icon;
	label: string;
};

export type NavSection = {
	label?: string;
	items: NavItem[];
};

export const mainNavSections: NavSection[] = [
	{
		items: [
			{ id: "programs", href: "/programs", icon: IconBox, label: "Programs" },
			{ id: "subjects", href: "/subjects", icon: IconCopy, label: "Subjects" },
			{
				id: "timetables",
				href: "/timetables",
				icon: IconCalendar,
				label: "Timetables",
			},
		],
	},
	{
		label: "People",
		items: [
			{
				id: "students",
				href: "/students",
				icon: IconSchool,
				label: "Students",
			},
			{ id: "faculty", href: "/faculty", icon: IconUser, label: "Faculty" },
		],
	},
	{
		label: "Operations",
		items: [
			{
				id: "attendance",
				href: "/attendance",
				icon: IconCalendarCheck,
				label: "Attendance",
			},
		],
	},
];

export function isNavActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function formatInstitutionRole(role: string) {
	return role.charAt(0).toUpperCase() + role.slice(1);
}
