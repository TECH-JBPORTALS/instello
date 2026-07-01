"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";

export function ProgramAvatar({
	name,
	size = "lg",
}: {
	name: string;
	size?: "sm" | "lg" | "default";
}) {
	return (
		<Avatar size={size} className={"after:rounded-lg"}>
			<AvatarImage
				src={`https://ui-avatars.com/api/?name=${name}&background=FAFAFA&color=000&rounded=false&bold=true&font-size=0.33&format=svg`}
				className={"rounded-lg"}
			/>
			<AvatarFallback className={"rounded-lg"}>{name.charAt(0)}</AvatarFallback>
		</Avatar>
	);
}
