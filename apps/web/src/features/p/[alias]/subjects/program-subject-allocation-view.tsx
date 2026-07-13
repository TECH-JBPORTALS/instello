"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import { Skeleton } from "@instello/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@instello/ui/components/tabs";
import { IconCalendarOff, IconPlus } from "@tabler/icons-react";
import { isUndefined } from "lodash";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { AllocateSubjectsCommand } from "./allocate-subjects-command";
import { ACTIVE_STAGE_QUERY_KEY } from "./constants";
import { ProgramSubjectList } from "./program-subject-list";

export function ProgramSubjectAllocationView() {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, {
		alias: programAlias,
	});
	const pattern = useInsQuery(
		api.academicPattern.queries.getAdoptedForActiveInstitution,
		{},
	);
	const [commandOpen, setCommandOpen] = useState(false);

	const [activeStageId, setActiveStageId] = useQueryState(
		ACTIVE_STAGE_QUERY_KEY,
		{ defaultValue: "", history: "replace" },
	);

	const stages = pattern?.stages ?? [];

	useEffect(() => {
		if (stages.length === 0) return;
		if (stages.some((stage) => stage._id === activeStageId)) return;

		const firstStage = stages[0];
		if (firstStage) void setActiveStageId(firstStage._id);
	}, [stages, activeStageId, setActiveStageId]);

	if (isUndefined(program) || isUndefined(pattern)) {
		return (
			<Container>
				<Skeleton className="mb-4 h-8 w-64" />
				<Skeleton className="mb-6 h-14 w-full" />
				<Skeleton className="h-72 w-full" />
			</Container>
		);
	}

	if (!pattern || stages.length === 0) {
		return (
			<Container>
				<Empty className="min-h-72 border border-dashed border-border">
					<EmptyMedia variant="icon">
						<IconCalendarOff />
					</EmptyMedia>
					<EmptyHeader>
						<EmptyTitle>No academic structure configured yet</EmptyTitle>
						<EmptyDescription>
							Adopt an academic pattern for your institution before allocating
							subjects to a program.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</Container>
		);
	}

	const activeStage =
		stages.find((stage) => stage._id === activeStageId) ?? stages[0];

	if (!activeStage) return null;

	return (
		<Container>
			<Tabs
				value={activeStage._id}
				onValueChange={(value) => void setActiveStageId(value as string)}
			>
				<TabsList>
					{stages.map((stage) => (
						<TabsTrigger key={stage._id} value={stage._id}>
							{stage.name}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			<PageHeader className="h-auto flex-col items-start gap-4 py-4 sm:flex-row sm:items-center">
				<PageHeaderStart>
					<PageHeaderTitle>Allocated Subjects</PageHeaderTitle>
					<PageHeaderDescription>
						Showing subjects allocated to{" "}
						<i className="text-foreground">{program.name}</i> for{" "}
						<i className="text-foreground">{activeStage.name}</i>.
					</PageHeaderDescription>
				</PageHeaderStart>
				<PageHeaderEnd>
					<Button onClick={() => setCommandOpen(true)}>
						<IconPlus />
						New alloc
					</Button>
				</PageHeaderEnd>
			</PageHeader>

			<ProgramSubjectList
				programId={program._id}
				academicStageId={activeStage._id}
				stageName={activeStage.name}
				onAllocate={() => setCommandOpen(true)}
			/>

			<AllocateSubjectsCommand
				open={commandOpen}
				onOpenChange={setCommandOpen}
				programId={program._id}
				academicStageId={activeStage._id}
			/>
		</Container>
	);
}
