"use client";

import { Button } from "@instello/ui/components/button";
import { IconX } from "@tabler/icons-react";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import {
	TIMETABLE_SUBJECT_TYPE_LABELS,
	type TimetableSubjectOption,
} from "@/components/timetable/types";
import { cn } from "@/lib/utils";

function formatHourLabel(hourIndex: number): string {
	return `H${hourIndex + 1}`;
}

function getHourSpanDuration(start: number, end: number): number {
	return end - start;
}

export function HourSpanCard({
	span,
	isOverlay,
	duration,
	onDelete,
	className,
}: {
	span: Pick<
		HourSpan,
		"start" | "end" | "subject" | "subjectType" | "room" | "batchName" | "color"
	>;
	isOverlay?: boolean;
	duration?: number;
	onDelete?: () => void;
	className?: string;
}) {
	const hourDuration = duration ?? getHourSpanDuration(span.start, span.end);

	return (
		<div
			className={cn(
				"relative flex h-full flex-col px-3 py-2 text-sm",
				isOverlay &&
					"w-[120px] rounded-md border bg-primary p-2 text-primary-foreground shadow-lg",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-1">
				<div className="pb-1 flex gap-1.5 items-center">
					<span
						className="text-xs font-semibold leading-none"
						style={{
							color: isOverlay
								? undefined
								: `color-mix(in srgb, ${span.color} 90%, transparent)`,
						}}
					>
						{formatHourLabel(span.start)} - {formatHourLabel(span.end - 1)}
					</span>
					<span className="text-[10px] opacity-80">{hourDuration}h</span>
				</div>
				{onDelete ? (
					<Button
						variant="ghost"
						size="icon"
						className="-mt-1 -mr-1 h-5 w-5 text-primary-foreground/70 hover:bg-white/20 hover:text-primary-foreground"
						onMouseDown={(event) => {
							event.stopPropagation();
						}}
						onClick={(event) => {
							event.stopPropagation();
							onDelete();
						}}
					>
						<IconX className="h-3 w-3" />
					</Button>
				) : null}
			</div>

			<div className="flex w-full flex-row flex-wrap gap-x-1.5 gap-y-0.5 items-end h-fit">
				<span className="truncate font-medium">
					{span.subject}
					{span.batchName ? ` (${span.batchName})` : ""}
				</span>
				{span.subjectType ? (
					<span className="truncate text-[10px] mx-0.5 uppercase text-accent-foreground/60">
						({TIMETABLE_SUBJECT_TYPE_LABELS[span.subjectType]})
					</span>
				) : null}
				{span.room ? (
					<span className="truncate text-xs text-accent-foreground/60">
						({span.room})
					</span>
				) : null}
			</div>
		</div>
	);
}

export function PaletteSubjectChip({
	subject,
}: {
	subject: TimetableSubjectOption;
}) {
	return (
		<div className="flex w-40 items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-lg">
			<span
				className="size-3 shrink-0 rounded-full"
				style={{ backgroundColor: subject.color }}
			/>
			<span className="truncate text-sm font-medium">{subject.name}</span>
		</div>
	);
}
