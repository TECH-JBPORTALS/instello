"use client";

import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { IconCircleDottedLetterP } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function PatternAvatar({
	size = "lg",
}: {
	name: string;
	size?: "sm" | "lg" | "default" | "xl";
}) {
	return (
		<Avatar size={size} className="after:rounded-lg">
			<AvatarFallback className="rounded-lg">
				<IconCircleDottedLetterP
					className={cn("text-muted-foreground", size === "xl" && "size-10")}
				/>
			</AvatarFallback>
		</Avatar>
	);
}
