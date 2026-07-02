"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { IconUser } from "@tabler/icons-react";
import { getStudentInitials } from "./forms/shared-form";

export function StudentAvatar({
	firstName,
	lastName,
	image,
	size = "lg",
}: {
	firstName: string;
	lastName: string;
	image?: string;
	size?: "sm" | "lg" | "default" | "xl";
}) {
	const displayName = `${firstName} ${lastName}`.trim();

	return (
		<Avatar size={size} className="after:rounded-lg">
			{image ? (
				<AvatarImage src={image} alt={displayName} className={"rounded-lg"} />
			) : null}
			<AvatarFallback className="rounded-lg">
				{firstName || lastName ? (
					getStudentInitials(firstName, lastName)
				) : (
					<IconUser className="size-4" />
				)}
			</AvatarFallback>
		</Avatar>
	);
}
