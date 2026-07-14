"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { hasLunchBreak, totalGridColumns } from "@instello/convex/schedule";
import React from "react";
import { HourSpanCard } from "@/components/timetable/hour-span-card";
import {
	canPlaceSpan,
	computeSubRowLayout,
	formatHourDropId,
	getMaxEndForResize,
	getMinStartForResize,
	type HourSpan,
	type SubRowLayout,
} from "@/components/timetable/hour-span-utils";
import {
	getHourColumnStyle,
	getLunchColumnStyle,
	getSpanColumnStyle,
} from "@/components/timetable/timetable-grid-layout";
import type { TimetableSessionConfig } from "@/components/timetable/types";
import { cn } from "@/lib/utils";

interface DayRowProps {
	dayIndex: number;
	numberOfhours: number;
	sessionConfig: TimetableSessionConfig;
	rowHeight: number;
	sessions: HourSpan[];
	readOnly?: boolean;
	onResize?: (id: string, range: { start: number; end: number }) => void;
	onSpanSelect?: (id: string) => void;
	selectedSpanId?: string | null;
}

function getSpanVerticalStyle(
	layout: SubRowLayout,
	rowHeight: number,
): { top: number; height: number } {
	const padding = 4;
	const gap = 2;
	const available = rowHeight - padding * 2;
	const laneHeight =
		(available - gap * (layout.subRowCount - 1)) / layout.subRowCount;
	const top = padding + layout.subRowIndex * (laneHeight + gap);

	return { top, height: laneHeight };
}

export function DayRow({
	dayIndex,
	numberOfhours,
	sessionConfig,
	rowHeight,
	sessions,
	readOnly = false,
	onResize,
	onSpanSelect,
	selectedSpanId,
}: DayRowProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const subRowLayout = React.useMemo(
		() => computeSubRowLayout(sessions),
		[sessions],
	);
	const lunchColumnStyle = getLunchColumnStyle(sessionConfig);
	const totalColumns = totalGridColumns(
		numberOfhours,
		hasLunchBreak(sessionConfig),
	);

	return (
		<div
			ref={containerRef}
			className="relative flex-1"
			style={{ minHeight: rowHeight }}
		>
			<div className="pointer-events-none absolute inset-0">
				{Array.from({ length: numberOfhours }).map((_, index) => (
					<div
						key={index}
						className="absolute inset-y-0 border-r border-dashed border-muted-foreground/20 last:border-r-0"
						style={getHourColumnStyle({ config: sessionConfig, hour: index })}
					/>
				))}
				{lunchColumnStyle ? (
					<div
						className="absolute inset-y-0 border-r bg-muted/10"
						style={{
							...lunchColumnStyle,
							backgroundImage:
								"repeating-linear-gradient(-45deg, transparent, transparent 6px, color-mix(in oklab, var(--color-muted-foreground) 20%, transparent) 6px, color-mix(in oklab, var(--color-muted-foreground) 20%, transparent) 8px)",
						}}
					/>
				) : null}
			</div>

			{readOnly
				? sessions.map((session) => (
						<StaticHourSpan
							key={session.id}
							session={session}
							sessionConfig={sessionConfig}
							verticalStyle={getSpanVerticalStyle(
								subRowLayout.get(session.id) ?? {
									subRowIndex: 0,
									subRowCount: 1,
								},
								rowHeight,
							)}
						/>
					))
				: null}

			{!readOnly
				? Array.from({ length: numberOfhours }).map((_, hour) => (
						<HourDropCell
							key={hour}
							id={formatHourDropId(dayIndex, hour)}
							sessionConfig={sessionConfig}
							hour={hour}
						/>
					))
				: null}

			{!readOnly
				? sessions.map((session) => (
						<DraggableHourSpan
							key={session.id}
							session={session}
							numberOfhours={numberOfhours}
							totalColumns={totalColumns}
							sessionConfig={sessionConfig}
							siblings={sessions}
							containerRef={containerRef}
							verticalStyle={getSpanVerticalStyle(
								subRowLayout.get(session.id) ?? {
									subRowIndex: 0,
									subRowCount: 1,
								},
								rowHeight,
							)}
							onResize={onResize}
							onSpanSelect={onSpanSelect}
							isSelected={selectedSpanId === session.id}
						/>
					))
				: null}
		</div>
	);
}

function StaticHourSpan({
	session,
	sessionConfig,
	verticalStyle,
}: {
	session: HourSpan;
	sessionConfig: TimetableSessionConfig;
	verticalStyle: { top: number; height: number };
}) {
	const columnStyle = getSpanColumnStyle({
		config: sessionConfig,
		start: session.start,
		end: session.end,
	});

	return (
		<div
			className="absolute z-10 overflow-hidden rounded-md border shadow-sm"
			style={{
				...columnStyle,
				top: verticalStyle.top,
				height: verticalStyle.height,
				backgroundColor: `color-mix(in srgb, ${session.color} 20%, transparent)`,
				borderColor: `color-mix(in srgb, ${session.color} 45%, transparent)`,
			}}
		>
			<HourSpanCard span={session} />
		</div>
	);
}

function HourDropCell({
	id,
	hour,
	sessionConfig,
}: {
	id: string;
	hour: number;
	sessionConfig: TimetableSessionConfig;
}) {
	const { setNodeRef, isOver } = useDroppable({ id });

	return (
		<div
			ref={setNodeRef}
			className={cn("absolute inset-y-0 z-0", isOver && "bg-primary/10")}
			style={getHourColumnStyle({ config: sessionConfig, hour })}
		/>
	);
}

interface DraggableHourSpanProps {
	session: HourSpan;
	numberOfhours: number;
	totalColumns: number;
	sessionConfig: TimetableSessionConfig;
	siblings: HourSpan[];
	containerRef: React.RefObject<HTMLDivElement | null>;
	verticalStyle: { top: number; height: number };
	onResize?: (id: string, range: { start: number; end: number }) => void;
	onSpanSelect?: (id: string) => void;
	isSelected?: boolean;
}

function DraggableHourSpan({
	session,
	numberOfhours,
	totalColumns,
	sessionConfig,
	siblings,
	containerRef,
	verticalStyle,
	onResize,
	onSpanSelect,
	isSelected,
}: DraggableHourSpanProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setDragRef,
		isDragging,
	} = useDraggable({ id: session.id });
	const { setNodeRef: setDropRef, isOver } = useDroppable({ id: session.id });

	const columnStyle = getSpanColumnStyle({
		config: sessionConfig,
		start: session.start,
		end: session.end,
	});

	const handleResizeStart = (
		event: React.PointerEvent<HTMLDivElement>,
		edge: "start" | "end",
	) => {
		event.stopPropagation();
		event.preventDefault();

		const container = containerRef.current;
		if (!container || !onResize) return;

		const pointerId = event.pointerId;
		const startX = event.clientX;
		const initialStart = session.start;
		const initialEnd = session.end;
		const columnWidth = container.getBoundingClientRect().width / totalColumns;

		const minStart = getMinStartForResize(siblings, session, initialEnd);
		const maxEnd = getMaxEndForResize(
			siblings,
			session,
			initialStart,
			numberOfhours,
		);

		const onPointerMove = (ev: PointerEvent) => {
			const deltaHours = Math.round((ev.clientX - startX) / columnWidth);

			if (edge === "start") {
				const newStart = Math.max(
					minStart,
					Math.min(initialStart + deltaHours, initialEnd - 1),
				);
				if (
					canPlaceSpan(
						siblings,
						session.id,
						session.day,
						newStart,
						initialEnd,
						numberOfhours,
						session.batchId,
					)
				) {
					onResize(session.id, { start: newStart, end: initialEnd });
				}
			} else {
				const newEnd = Math.min(
					maxEnd,
					Math.max(initialEnd + deltaHours, initialStart + 1),
				);
				if (
					canPlaceSpan(
						siblings,
						session.id,
						session.day,
						initialStart,
						newEnd,
						numberOfhours,
						session.batchId,
					)
				) {
					onResize(session.id, { start: initialStart, end: newEnd });
				}
			}
		};

		const onPointerUp = (ev: PointerEvent) => {
			container.releasePointerCapture(ev.pointerId);
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
		};

		container.setPointerCapture(pointerId);
		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);
	};

	return (
		<div
			ref={(node) => {
				setDragRef(node);
				setDropRef(node);
			}}
			className={cn(
				"absolute z-10 overflow-hidden transition-all ease-linear rounded-md border shadow-sm",
				"cursor-grab active:cursor-grabbing",
				isDragging && "opacity-50",
				isOver && "ring-2 ring-primary/40",
				isSelected && "ring-2 ring-primary",
			)}
			style={{
				...columnStyle,
				top: verticalStyle.top,
				height: verticalStyle.height,
				backgroundColor: `color-mix(in srgb, ${session.color} 20%, transparent)`,
				borderColor: `color-mix(in srgb, ${session.color} 45%, transparent)`,
			}}
		>
			<div
				className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-ew-resize hover:bg-foreground/10"
				onPointerDown={(event) => handleResizeStart(event, "start")}
			/>

			<button
				type="button"
				className="h-full w-full cursor-grab text-left text-foreground active:cursor-grabbing"
				suppressHydrationWarning
				{...listeners}
				{...attributes}
				onClick={() => onSpanSelect?.(session.id)}
			>
				<HourSpanCard span={session} />
			</button>

			<div
				className="absolute inset-y-0 right-0 z-10 w-1.5 cursor-ew-resize hover:bg-foreground/10"
				onPointerDown={(event) => handleResizeStart(event, "end")}
			/>
		</div>
	);
}
