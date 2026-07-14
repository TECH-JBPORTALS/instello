"use client";

import { DayRow } from "@/components/timetable/day-row";
import {
	DAY_ROW_BASE_HEIGHT_PX,
	getMaxSubRowsForDay,
	type HourSpan,
} from "@/components/timetable/hour-span-utils";
import { createDefaultSessionConfig } from "@/components/timetable/timetable-config-utils";
import {
	formatLunchTimeRange,
	getHourColumnStyle,
	getLunchColumnStyle,
	getPeriodHeaderLabel,
} from "@/components/timetable/timetable-grid-layout";
import type { TimetableSessionConfig } from "@/components/timetable/types";
import { cn } from "@/lib/utils";

export type { HourSpan } from "@/components/timetable/hour-span-utils";

const DAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

/** Timetable table viewer - Wrapper around read only timetable editor. */
export function TimetableViewer({
	spans,
	sessionConfig = createDefaultSessionConfig(),
	className,
}: {
	spans: HourSpan[];
	sessionConfig?: TimetableSessionConfig;
	className?: string;
}) {
	return (
		<TimetableEditor
			data={spans}
			sessionConfig={sessionConfig}
			readOnly
			className={className}
		/>
	);
}

/** Interactive or read-only hour grid for a class timetable. */
export function TimetableEditor({
	days = [0, 1, 2, 3, 4, 5],
	sessionConfig = createDefaultSessionConfig(),
	className,
	data = [],
	readOnly = false,
	onResize,
	onSpanSelect,
	selectedSpanId,
}: {
	days?: number[];
	sessionConfig?: TimetableSessionConfig;
	className?: string;
	data?: HourSpan[];
	readOnly?: boolean;
	onResize?: (id: string, range: { start: number; end: number }) => void;
	onSpanSelect?: (id: string) => void;
	selectedSpanId?: string | null;
}) {
	const numberOfhours = sessionConfig.totalHours;
	const lunchColumnStyle = getLunchColumnStyle(sessionConfig);

	return (
		<div
			className={cn(
				"flex h-fit w-full flex-col overflow-hidden rounded-md border bg-background select-none",
				className,
			)}
		>
			<div className="flex w-full border-b bg-muted/40">
				<div className="w-20 shrink-0 border-r p-2 text-xs font-medium text-muted-foreground" />
				<div className="relative flex flex-1 py-3" style={{ minHeight: 56 }}>
					{Array.from({ length: numberOfhours }).map((_, index) => {
						const style = getHourColumnStyle({
							config: sessionConfig,
							hour: index,
						});

						return (
							<div
								key={`period-header-${index}`}
								className="absolute inset-y-0 flex flex-col items-center justify-center border-r px-2 text-center last:border-r-0"
								style={style}
							>
								<span className="text-sm font-medium">H{index + 1}</span>
								<span className="text-xs text-muted-foreground">
									{getPeriodHeaderLabel(sessionConfig, index)}
								</span>
							</div>
						);
					})}
					{lunchColumnStyle ? (
						<div
							className="absolute inset-y-0 flex flex-col items-center justify-center border-r bg-muted/20 px-1 text-center"
							style={lunchColumnStyle}
						>
							<span className="text-[10px] font-medium uppercase tracking-wide">
								Lunch
							</span>
							<span className="text-[10px] text-muted-foreground">
								{formatLunchTimeRange(sessionConfig)}
							</span>
						</div>
					) : null}
				</div>
			</div>

			<div className="flex flex-1 flex-col overflow-y-auto">
				{days.map((dayIndex) => {
					const daySessions = data.filter(
						(hourSpan) => hourSpan.day === dayIndex,
					);
					const maxSubRows = getMaxSubRowsForDay(daySessions);
					const rowHeight = DAY_ROW_BASE_HEIGHT_PX * maxSubRows;

					return (
						<div
							key={dayIndex}
							className="flex h-min w-full border-b last:border-b-0"
							style={{ minHeight: rowHeight }}
						>
							<div
								className="flex w-20 shrink-0 items-center justify-center border-r bg-muted/15 px-2 py-3 text-sm font-medium"
								style={{ minHeight: rowHeight }}
							>
								<span className="-rotate-45">
									{DAYS[dayIndex]?.slice(0, 3)}
								</span>
							</div>

							<DayRow
								dayIndex={dayIndex}
								numberOfhours={numberOfhours}
								sessionConfig={sessionConfig}
								rowHeight={rowHeight}
								sessions={daySessions}
								readOnly={readOnly}
								onResize={onResize}
								onSpanSelect={onSpanSelect}
								selectedSpanId={selectedSpanId}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
