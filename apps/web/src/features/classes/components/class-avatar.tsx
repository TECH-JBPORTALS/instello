"use client";

import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { IconChalkboardTeacher } from "@tabler/icons-react";

export function ClassAvatar({
	size = "lg",
}: {
	size?: "sm" | "lg" | "default";
}) {
	return (
		<Avatar size={size} className={"after:rounded-lg"}>
			<AvatarFallback className={"rounded-lg"}>
				<IconChalkboardTeacher />
			</AvatarFallback>
		</Avatar>
	);
}
