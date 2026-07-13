"use client";

import type { Id } from "@instello/convex/dataModel";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@instello/ui/components/item";
import { IconPencil } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { EditStageDialog } from "./edit-stage-dialog";

type Stage = {
	_id: Id<"academicStages">;
	name: string;
	alias: string;
	sequenceNumber: number;
	yearNumber: number;
};

type StagesSectionProps = {
	stages: Stage[];
};

export function StagesSection({ stages }: StagesSectionProps) {
	const [editingStage, setEditingStage] = useState<Stage | null>(null);

	const sortedStages = useMemo(
		() => [...stages].sort((a, b) => a.sequenceNumber - b.sequenceNumber),
		[stages],
	);

	if (sortedStages.length === 0) {
		return null;
	}

	return (
		<div>
			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Stages</CardTitle>
					<CardDescription>
						Semesters or terms in this pattern. Edit names and aliases to match
						how your institution labels them.
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					{sortedStages.map((stage) => (
						<Item key={stage._id} variant="outline" className="flex-nowrap">
							<ItemMedia className="w-6 justify-start tabular-nums text-muted-foreground">
								{stage.sequenceNumber}
							</ItemMedia>
							<ItemContent className="min-w-0 flex-none flex-row items-center gap-2">
								<ItemTitle>{stage.name}</ItemTitle>
								<Badge variant="secondary" className="uppercase">
									{stage.alias}
								</Badge>
							</ItemContent>
							<div className="flex flex-1 justify-center">
								<Badge variant="outline">Year {stage.yearNumber}</Badge>
							</div>
							<ItemActions>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setEditingStage(stage)}
								>
									<IconPencil className="size-4" />
									Edit
								</Button>
							</ItemActions>
						</Item>
					))}
				</ItemGroup>
			</Card>

			{editingStage && (
				<EditStageDialog
					stage={editingStage}
					open={editingStage !== null}
					onOpenChange={(open) => {
						if (!open) setEditingStage(null);
					}}
				/>
			)}
		</div>
	);
}
