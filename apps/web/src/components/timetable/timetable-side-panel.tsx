"use client";

import { Button } from "@instello/ui/components/button";
import { IconArrowLeft } from "@tabler/icons-react";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import { SubjectPalettePanel } from "@/components/timetable/subject-palette-panel";
import { SubjectPropertiesPanel } from "@/components/timetable/subject-properties-panel";
import { TimetableConfigPanel } from "@/components/timetable/timetable-config-panel";
import type {
	SidePanelState,
	SidePanelTab,
	TimetableBatchOption,
	TimetableSessionConfig,
	TimetableSubjectOption,
} from "@/components/timetable/types";
import { cn } from "@/lib/utils";

function SidePanelTabs({
	activeTab,
	onChange,
}: {
	activeTab: SidePanelTab;
	onChange: (tab: SidePanelTab) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
			{(["subjects", "timing"] as const).map((tab) => (
				<button
					key={tab}
					type="button"
					className={cn(
						"rounded-sm px-2 py-1.5 text-xs font-medium capitalize transition-colors",
						activeTab === tab
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
					onClick={() => onChange(tab)}
				>
					{tab}
				</button>
			))}
		</div>
	);
}

export function TimetableSidePanel({
	sidePanelTab,
	setSidePanelTab,
	sidePanel,
	subjects,
	batches,
	selectedSpan,
	sessionConfig,
	spans,
	onSessionConfigChange,
	onBack,
	onUpdateSpan,
	onRemoveSpan,
	className,
}: {
	sidePanelTab: SidePanelTab;
	setSidePanelTab: (tab: SidePanelTab) => void;
	sidePanel: SidePanelState;
	subjects: TimetableSubjectOption[];
	batches: TimetableBatchOption[];
	selectedSpan: HourSpan | null;
	sessionConfig: TimetableSessionConfig;
	spans: HourSpan[];
	onSessionConfigChange: (config: TimetableSessionConfig) => void;
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
				"flex shrink-0 flex-col w-80 overflow-hidden rounded-md border bg-background",
				className,
			)}
		>
			<div className="flex flex-col gap-3 border-b px-3 py-3">
				<SidePanelTabs activeTab={sidePanelTab} onChange={setSidePanelTab} />

				{sidePanelTab === "subjects" && sidePanel === "properties" ? (
					<div className="flex items-center gap-2">
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
					</div>
				) : sidePanelTab === "subjects" ? (
					<div>
						<p className="text-sm font-medium">Subjects</p>
						<p className="text-xs text-muted-foreground">
							Drag a subject onto the timetable
						</p>
					</div>
				) : (
					<div>
						<p className="text-sm font-medium">Session timing</p>
						<p className="text-xs text-muted-foreground">
							Set period start and end times
						</p>
					</div>
				)}
			</div>

			{sidePanelTab === "timing" ? (
				<TimetableConfigPanel
					config={sessionConfig}
					spans={spans}
					onChange={onSessionConfigChange}
				/>
			) : sidePanel === "properties" && selectedSpan ? (
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
