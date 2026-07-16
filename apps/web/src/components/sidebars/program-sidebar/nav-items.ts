"use client";

import type { Icon } from "@tabler/icons-react";
import { IconBook, IconSchool, IconTable, IconUser } from "@tabler/icons-react";

export type ProgramNavItem = {
	id: string;
	segment: string;
	icon: Icon;
	label: string;
};

export const programNavItems: ProgramNavItem[] = [
	{ id: "classes", segment: "classes", icon: IconSchool, label: "Classes" },
	{
		id: "subjects",
		segment: "subjects",
		icon: IconBook,
		label: "Subjects",
	},
	{
		id: "timetables",
		segment: "timetables",
		icon: IconTable,
		label: "Timetables",
	},
	{ id: "faculty", segment: "faculty", icon: IconUser, label: "Faculty" },
];

export function isProgramNavActive(
	currentSegment: string | null,
	itemSegment: string,
) {
	if (!currentSegment) return itemSegment === "classes";
	return currentSegment === itemSegment;
}
