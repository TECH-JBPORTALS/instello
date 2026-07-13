"use client";

import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { IconBox } from "@tabler/icons-react";

export function ProgramAvatar({
	size = "lg",
}: {
	name: string;
	size?: "sm" | "lg" | "default";
}) {
	return (
		<Avatar size={size} className={"after:rounded-lg"}>
			<AvatarFallback className={"rounded-lg"}>
				<IconBox className="size-4" />
			</AvatarFallback>
		</Avatar>
	);
}
