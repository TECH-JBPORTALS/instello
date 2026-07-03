"use client";

import type { Icon } from "@tabler/icons-react";
import { IconSchool, IconTable } from "@tabler/icons-react";

export type ProgramNavItem = {
	id: string;
	segment: string;
	icon: Icon;
	label: string;
};

export const programNavItems: ProgramNavItem[] = [
	{ id: "classes", segment: "classes", icon: IconSchool, label: "Classes" },
	{
		id: "timetables",
		segment: "timetables",
		icon: IconTable,
		label: "Timetables",
	},
	// {
	// 	id: "subjects",
	// 	segment: "subjects",
	// 	icon: IconBook,
	// 	label: "Subjects",
	// },
	// { id: "faculty", segment: "faculty", icon: IconUser, label: "Faculty" },
];

export function isProgramNavActive(
	currentSegment: string | null,
	itemSegment: string,
) {
	if (!currentSegment) return itemSegment === "classes";
	return currentSegment === itemSegment;
}
