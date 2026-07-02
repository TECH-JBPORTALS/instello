import type { Icon } from "@tabler/icons-react";
import { IconBox, IconCopy, IconUser } from "@tabler/icons-react";

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
		label: "INSTITUTION",
		items: [
			{ id: "programs", href: "/programs", icon: IconBox, label: "Programs" },
			{ id: "subjects", href: "/subjects", icon: IconCopy, label: "Subjects" },
			{ id: "faculty", href: "/faculty", icon: IconUser, label: "Faculty" },
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
