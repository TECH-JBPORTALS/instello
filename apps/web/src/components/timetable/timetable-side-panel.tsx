"use client";

import { Button } from "@instello/ui/components/button";
import { IconArrowLeft } from "@tabler/icons-react";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import { SubjectPalettePanel } from "@/components/timetable/subject-palette-panel";
import { SubjectPropertiesPanel } from "@/components/timetable/subject-properties-panel";
import type {
	SidePanelState,
	TimetableBatchOption,
	TimetableSubjectOption,
} from "@/components/timetable/types";
import { cn } from "@/lib/utils";

export function TimetableSidePanel({
	sidePanel,
	subjects,
	batches,
	selectedSpan,
	onBack,
	onUpdateSpan,
	onRemoveSpan,
	className,
}: {
	sidePanel: SidePanelState;
	subjects: TimetableSubjectOption[];
	batches: TimetableBatchOption[];
	selectedSpan: HourSpan | null;
	onBack: () => void;
	onUpdateSpan: (
		patch: Partial<Pick<HourSpan, "room" | "notes" | "batchId" | "batchName">>,
	) => void;
	onRemoveSpan: () => void;
	className?: string;
}) {
	return (
		<aside
			className={cn(
				"flex w-72 shrink-0 flex-col overflow-hidden rounded-md border bg-background",
				className,
			)}
		>
			<div className="flex items-center gap-2 border-b px-3 py-3">
				{sidePanel === "properties" ? (
					<>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={onBack}
							aria-label="Back to subjects"
						>
							<IconArrowLeft className="size-4" />
						</Button>
						<div className="min-w-0 flex-1">
							<p className="text-xs text-muted-foreground">Slot properties</p>
							<p className="truncate text-sm font-medium">
								{selectedSpan?.subject}
							</p>
						</div>
					</>
				) : (
					<div>
						<p className="text-sm font-medium">Subjects</p>
						<p className="text-xs text-muted-foreground">
							Drag a subject onto the timetable
						</p>
					</div>
				)}
			</div>

			{sidePanel === "properties" && selectedSpan ? (
				<SubjectPropertiesPanel
					span={selectedSpan}
					batches={batches}
					onUpdateSpan={onUpdateSpan}
					onRemoveSpan={onRemoveSpan}
				/>
			) : (
				<SubjectPalettePanel subjects={subjects} />
			)}
		</aside>
	);
}
