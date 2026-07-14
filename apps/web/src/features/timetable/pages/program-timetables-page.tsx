"use client";

import { api } from "@instello/convex/api";
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
	ItemContent,
	ItemGroup,
	ItemMedia,
} from "@instello/ui/components/item";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconTable } from "@tabler/icons-react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import {
	ProgramTimetableClassItem,
	type ProgramTimetableItem,
} from "@/features/timetable/components/program-timetable-class-item";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";

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

export function ProgramTimetablesPage() {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});
	const items = useInsQuery(
		api.timetable.queries.listByProgram,
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
									<ProgramTimetableClassItem
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
