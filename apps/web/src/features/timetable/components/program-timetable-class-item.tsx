"use client";

import type { api } from "@instello/convex/api";
import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { IconTable, IconTag, IconUser } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { programPath } from "@/features/programs/program-path";

export type ProgramTimetableItem = FunctionReturnType<
	typeof api.timetable.queries.listByProgram
>[number];

export function ProgramTimetableClassItem({
	item,
	programAlias,
}: {
	item: ProgramTimetableItem;
	programAlias: string;
}) {
	const { class: cls, timetable } = item;

	return (
		<Item
			className="border-x-0 border-t-0 hover:bg-accent/30 last:border-b-0 relative rounded-none border-border!"
			render={
				<Link href={programPath(programAlias, `timetables/${cls.slug}`)} />
			}
		>
			<ItemMedia variant="icon">
				<Avatar size="lg" className="after:rounded-lg">
					<AvatarFallback className="rounded-lg">
						<IconTable />
					</AvatarFallback>
				</Avatar>
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{cls.name}</ItemTitle>
				{timetable ? (
					<div className="flex items-center gap-1.5">
						<Avatar size="xs">
							<AvatarFallback>
								<IconUser className="size-3" />
							</AvatarFallback>
						</Avatar>
						<strong className="text-xs text-muted-foreground">
							{`${timetable.commitedBy.firstName} ${timetable.commitedBy.lastName}`.trim()}
						</strong>
						<span className="text-muted-foreground font-bold">·</span>
						<ItemDescription className="truncate text-muted-foreground">
							{timetable.changeMessage}
						</ItemDescription>
					</div>
				) : (
					<ItemDescription className="text-muted-foreground">
						Not published yet
					</ItemDescription>
				)}
			</ItemContent>
			{timetable ? (
				<ItemActions>
					<span className="text-xs text-muted-foreground">
						{formatDistanceToNow(timetable.updatedAt, { addSuffix: true })}
					</span>
					<Badge variant="outline" className="gap-1">
						<IconTag className="size-3" />v{timetable.version}
					</Badge>
				</ItemActions>
			) : null}
		</Item>
	);
}
