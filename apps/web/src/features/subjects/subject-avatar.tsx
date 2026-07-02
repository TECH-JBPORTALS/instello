"use client";

import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { getSubjectInitials, subjectColorStyles } from "./constants";

export function SubjectAvatar({
	name,
	color,
	size = "lg",
}: {
	name: string;
	color: string;
	size?: "sm" | "default" | "lg" | "xl";
}) {
	const initials = getSubjectInitials(name);

	return (
		<Avatar size={size} className="after:rounded-lg">
			<AvatarFallback
				className="rounded-lg font-semibold text-white"
				style={subjectColorStyles(color)}
			>
				{initials}
			</AvatarFallback>
		</Avatar>
	);
}
