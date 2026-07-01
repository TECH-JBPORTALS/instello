"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";

export function ProgramAvatar({ name }: { name: string }) {
	return (
		<Avatar size="lg" className={"after:rounded-lg"}>
			<AvatarImage
				src={`https://ui-avatars.com/api/?name=${name}&background=FAFAFA&color=000&rounded=false`}
				className={"rounded-lg"}
			/>
			<AvatarFallback className={"rounded-lg"}>{name.charAt(0)}</AvatarFallback>
		</Avatar>
	);
}
