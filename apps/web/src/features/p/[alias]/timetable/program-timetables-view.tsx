"use client";

import { api } from "@instello/convex/api";
import { Avatar, AvatarFallback } from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import { Card, CardHeader, CardTitle } from "@instello/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconTable, IconTag, IconUser } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { programPath } from "@/lib/program-path";

type ProgramTimetableItem = FunctionReturnType<
	typeof api.timetables.listByProgram
>[number];
type StageSummary = ProgramTimetableItem["class"]["stage"];

interface StageGroup {
	stage: StageSummary;
	classes: ProgramTimetableItem[];
}

function groupByStage(items: ProgramTimetableItem[]): StageGroup[] {
	const groups: StageGroup[] = [];
	const indexByStage = new Map<string, number>();

	for (const item of items) {
		const stageId = item.class.stage._id;
		const existingIndex = indexByStage.get(stageId);

		if (existingIndex === undefined) {
			indexByStage.set(stageId, groups.length);
			groups.push({ stage: item.class.stage, classes: [item] });
		} else {
			groups[existingIndex]?.classes.push(item);
		}
	}

	return groups;
}

function ProgramTimetablesSkeleton() {
	return (
		<div className="space-y-6">
			{Array.from({ length: 2 }).map((_, groupIndex) => (
				<div key={groupIndex} className="space-y-3">
					<Skeleton className="h-5 w-32" />
					<div className="rounded-lg border shadow-xs">
						{Array.from({ length: 2 }).map((_, rowIndex) => (
							<Item
								key={rowIndex}
								className="border-x-0 border-t-0 last:border-b-0 rounded-none border-border!"
							>
								<ItemMedia variant="icon">
									<Skeleton className="size-10 rounded-lg" />
								</ItemMedia>
								<ItemContent className="space-y-2.5">
									<Skeleton className="h-3 w-32" />
									<Skeleton className="h-2 w-48" />
								</ItemContent>
							</Item>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function ClassTimetableRow({
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

export function ProgramTimetablesView() {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const items = useInsQuery(
		api.timetables.listByProgram,
		program ? { programId: program._id } : "skip",
	);

	const groups = items ? groupByStage(items) : [];

	return (
		<Container className="flex min-h-0 flex-1 flex-col">
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Timetables</PageHeaderTitle>
					<PageHeaderDescription>
						Manage timetables for{" "}
						<i className="text-foreground">{program?.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			{items === undefined ? (
				<ProgramTimetablesSkeleton />
			) : items.length === 0 ? (
				<Empty className="border border-border min-h-72 border-dashed">
					<EmptyMedia variant="icon">
						<IconTable />
					</EmptyMedia>
					<EmptyHeader>
						<EmptyTitle>No classes yet</EmptyTitle>
						<EmptyDescription>
							Create classes for this program to manage their timetables.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="space-y-6">
					{groups.map((group) => (
						<Card
							key={group.stage._id}
							className="bg-transparent ring-0! shadow-none"
						>
							<CardHeader className="px-0">
								<CardTitle>{group.stage.name}</CardTitle>
							</CardHeader>
							<ItemGroup className="bg-card" variant="stack">
								{group.classes.map((item) => (
									<ClassTimetableRow
										key={item.class._id}
										item={item}
										programAlias={programAlias}
									/>
								))}
							</ItemGroup>
						</Card>
					))}
				</div>
			)}
		</Container>
	);
}
