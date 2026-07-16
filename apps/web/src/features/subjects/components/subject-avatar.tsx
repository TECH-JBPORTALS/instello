"use client";

import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { cn } from "@/lib/utils";
import { getSubjectInitials, subjectColorStyles } from "../constants";

export function SubjectAvatar({
	name,
	color,
	size = "lg",
}: {
	name: string;
	color: string;
	size?: "sm" | "default" | "lg" | "xl" | "xs";
}) {
	const initials = getSubjectInitials(name);

	return (
		<Avatar size={size} className="after:rounded-lg">
			<AvatarFallback
				className={cn(
					"rounded-lg font-semibold text-white",
					size === "xl" && "text-4xl",
					size === "xs" && "text-xs",
				)}
				style={subjectColorStyles(color)}
			>
				{initials}
			</AvatarFallback>
		</Avatar>
	);
}
