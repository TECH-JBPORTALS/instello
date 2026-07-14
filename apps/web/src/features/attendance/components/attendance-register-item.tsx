"use client";

import type { api } from "@instello/convex/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { IconCalendarCheck, IconPencil, IconUser } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { classPath } from "@/features/classes/class-path";
import { subjectColorStyles } from "@/features/subjects/constants";

type AttendanceRegister = FunctionReturnType<
	typeof api.attendance.queries.listRegisters
>[0];

export function AttendanceRegisterItem({
	register,
	programAlias,
	classSlug,
}: {
	register: AttendanceRegister;
	programAlias: string;
	classSlug: string;
}) {
	return (
		<Item
			className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
			key={register._id}
			render={
				<Link
					href={classPath(
						programAlias,
						classSlug,
						`attendance/${register._id}`,
					)}
				/>
			}
		>
			<ItemMedia variant="icon">
				<Avatar size="lg" className="after:rounded-lg">
					<AvatarFallback
						className="rounded-lg"
						style={subjectColorStyles(register.subjectColor)}
					>
						{register.type === "theory" ? (
							<IconPencil />
						) : (
							<IconCalendarCheck />
						)}
					</AvatarFallback>
				</Avatar>
			</ItemMedia>
			<ItemContent>
				<ItemTitle>
					{register.subjectName}
					<Badge variant="outline">{register.subjectCode}</Badge>
					<Badge variant="outline" className="gap-1">
						{register.type === "theory" ? (
							<IconPencil className="size-3" />
						) : (
							<IconCalendarCheck className="size-3" />
						)}
						{register.type === "theory" ? "Theory" : "Practical"}
					</Badge>
				</ItemTitle>
				{register.activity ? (
					<div className="flex items-center gap-1.5">
						<Avatar size="xs">
							{register.activity.actor.image ? (
								<AvatarImage
									src={register.activity.actor.image}
									alt={register.activity.actor.name}
								/>
							) : null}
							<AvatarFallback>
								<IconUser className="size-3" />
							</AvatarFallback>
						</Avatar>
						<strong className="text-xs text-muted-foreground">
							{register.activity.actor.name}
						</strong>
						<span className="text-muted-foreground font-bold">·</span>
						<ItemDescription className="truncate text-muted-foreground">
							{register.activity.description}
						</ItemDescription>
					</div>
				) : (
					<ItemDescription className="text-muted-foreground">
						No attendance marked yet
					</ItemDescription>
				)}
			</ItemContent>
			{register.activity ? (
				<ItemActions>
					<span className="text-xs text-muted-foreground">
						last updated{" "}
						{formatDistanceToNow(register.activity.updatedAt, {
							addSuffix: true,
						})}
					</span>
				</ItemActions>
			) : null}
		</Item>
	);
}
