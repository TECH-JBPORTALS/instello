"use client";

import {
	type CollisionDetection,
	DndContext,
	DragOverlay,
	PointerSensor,
	pointerWithin,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { Button } from "@instello/ui/components/button";
import { IconX } from "@tabler/icons-react";
import React from "react";
import {
	canPlaceSpan,
	formatHourDropId,
	getMaxEndForResize,
	getMinStartForResize,
	type HourSpan,
	isPaletteDragId,
} from "@/components/timetable/hour-span-utils";
import { TimetableSidePanel } from "@/components/timetable/timetable-side-panel";
import {
	TIMETABLE_SUBJECT_TYPE_LABELS,
	type TimetableSubjectOption,
} from "@/components/timetable/types";
import type { TimetableEditorController } from "@/components/timetable/use-timetable-editor";
import { cn } from "@/lib/utils";

export type { HourSpan } from "@/components/timetable/hour-span-utils";

/**
 * Prefer span droppables over hour cells when moving existing spans.
 * Palette drags only target hour cells.
 */
export const preferEditorCollision: CollisionDetection = (args) => {
	const collisions = pointerWithin(args);
	const activeId = String(args.active.id);

	if (isPaletteDragId(activeId)) {
		return collisions.filter((collision) =>
			String(collision.id).startsWith("hour-"),
		);
	}

	const spanCollision = collisions.find((collision) => {
		const id = String(collision.id);
		return !id.startsWith("hour-") && !isPaletteDragId(id);
	});

	return spanCollision ? [spanCollision] : collisions;
};

function formatHourLabel(hourIndex: number): string {
	return `H${hourIndex + 1}`;
}

function getHourSpanDuration(start: number, end: number): number {
	return end - start;
}

const DAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export function TimetableViewer({
	spans,
	className,
}: {
	spans: HourSpan[];
	className?: string;
}) {
	return <TimetableEditor data={spans} readOnly className={className} />;
}

export function TimetableEditor({
	days = [0, 1, 2, 3, 4, 5],
	numberOfhours = 7,
	className,
	data = [],
	readOnly = false,
	onResize,
	onSpanSelect,
	selectedSpanId,
}: {
	days?: number[];
	numberOfhours?: number;
	className?: string;
	data?: HourSpan[];
	readOnly?: boolean;
	onResize?: (id: string, range: { start: number; end: number }) => void;
	onSpanSelect?: (id: string) => void;
	selectedSpanId?: string | null;
}) {
	return (
		<div
			className={cn(
				"flex h-fit w-full flex-col overflow-hidden rounded-md border bg-background select-none",
				className,
			)}
		>
			<div className="flex w-full border-b bg-muted/40">
				<div className="w-20 shrink-0 border-r p-2 text-xs font-medium text-muted-foreground" />
				<div className="flex flex-1">
					{Array.from({ length: numberOfhours }).map((_, index) => (
						<div
							key={index}
							className="flex-1 border-r px-2 py-3 text-center text-sm font-medium last:border-r-0"
						>
							H{index + 1}
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-1 flex-col overflow-y-auto">
				{days.map((dayIndex) => (
					<div
						key={dayIndex}
						className="flex h-min min-h-20 max-h-fit w-full border-b last:border-b-0"
					>
						<div className="flex h-20 w-20 shrink-0 items-center justify-center border-r bg-muted/15 px-2 py-3 text-sm font-medium">
							<span className="-rotate-45">{DAYS[dayIndex]?.slice(0, 3)}</span>
						</div>

						<DayRow
							dayIndex={dayIndex}
							numberOfhours={numberOfhours}
							sessions={data.filter((hourSpan) => hourSpan.day === dayIndex)}
							readOnly={readOnly}
							onResize={onResize}
							onSpanSelect={onSpanSelect}
							selectedSpanId={selectedSpanId}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

export function TimetableEditorShell({
	editor,
}: {
	editor: TimetableEditorController;
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
	);

	const { dndProps, editorProps, sidePanelProps } = editor;

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={preferEditorCollision}
			onDragStart={dndProps.onDragStart}
			onDragEnd={dndProps.onDragEnd}
			onDragCancel={dndProps.onDragCancel}
		>
			<div className="flex items-start gap-4">
				<TimetableEditor className="min-w-0 flex-1" {...editorProps} />
				<TimetableSidePanel {...sidePanelProps} />
			</div>

			<DragOverlay dropAnimation={null}>
				{dndProps.activeDragSpan ? (
					<HourSpanCard span={dndProps.activeDragSpan} isOverlay />
				) : null}
				{!dndProps.activeDragSpan && dndProps.activeDragSubject ? (
					<PaletteSubjectChip subject={dndProps.activeDragSubject} />
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

/* --- SUB COMPONENTS --- */

interface DayRowProps {
	dayIndex: number;
	numberOfhours: number;
	sessions: HourSpan[];
	readOnly?: boolean;
	onResize?: (id: string, range: { start: number; end: number }) => void;
	onSpanSelect?: (id: string) => void;
	selectedSpanId?: string | null;
}

function DayRow({
	dayIndex,
	numberOfhours,
	sessions,
	readOnly = false,
	onResize,
	onSpanSelect,
	selectedSpanId,
}: DayRowProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);

	return (
		<div ref={containerRef} className="relative min-h-20 flex-1">
			<div className="pointer-events-none absolute inset-0 flex flex-row">
				{Array.from({ length: numberOfhours }).map((_, index) => (
					<div
						key={index}
						className="flex-1 border-r border-dashed border-muted-foreground/20 last:border-r-0"
					/>
				))}
			</div>

			{readOnly
				? sessions.map((session) => (
						<StaticHourSpan
							key={session.id}
							session={session}
							numberOfhours={numberOfhours}
						/>
					))
				: null}

			{!readOnly
				? Array.from({ length: numberOfhours }).map((_, hour) => (
						<HourDropCell
							key={hour}
							id={formatHourDropId(dayIndex, hour)}
							numberOfhours={numberOfhours}
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
							siblings={sessions}
							containerRef={containerRef}
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
	numberOfhours,
}: {
	session: HourSpan;
	numberOfhours: number;
}) {
	const duration = session.end - session.start;

	return (
		<div
			className="absolute top-1 bottom-1 z-10 overflow-hidden rounded-md border shadow-sm"
			style={{
				left: `${(session.start / numberOfhours) * 100}%`,
				width: `${(duration / numberOfhours) * 100}%`,
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
	numberOfhours,
}: {
	id: string;
	hour: number;
	numberOfhours: number;
}) {
	const { setNodeRef, isOver } = useDroppable({ id });

	return (
		<div
			ref={setNodeRef}
			className={cn("absolute inset-y-0 z-0", isOver && "bg-primary/10")}
			style={{
				left: `${(hour / numberOfhours) * 100}%`,
				width: `${(1 / numberOfhours) * 100}%`,
			}}
		/>
	);
}

interface DraggableHourSpanProps {
	session: HourSpan;
	numberOfhours: number;
	siblings: HourSpan[];
	containerRef: React.RefObject<HTMLDivElement | null>;
	onResize?: (id: string, range: { start: number; end: number }) => void;
	onSpanSelect?: (id: string) => void;
	isSelected?: boolean;
}

function DraggableHourSpan({
	session,
	numberOfhours,
	siblings,
	containerRef,
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

	const duration = session.end - session.start;

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
		const hourWidth = container.getBoundingClientRect().width / numberOfhours;

		const minStart = getMinStartForResize(siblings, session.id, initialEnd);
		const maxEnd = getMaxEndForResize(
			siblings,
			session.id,
			initialStart,
			numberOfhours,
		);

		const onPointerMove = (ev: PointerEvent) => {
			const deltaHours = Math.round((ev.clientX - startX) / hourWidth);

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
				"absolute top-1 bottom-1 z-10 overflow-hidden transition-all ease-linear rounded-md border shadow-sm",
				"cursor-grab active:cursor-grabbing",
				isDragging && "opacity-50",
				isOver && "ring-2 ring-primary/40",
				isSelected && "ring-2 ring-primary",
			)}
			style={{
				left: `${(session.start / numberOfhours) * 100}%`,
				width: `${(duration / numberOfhours) * 100}%`,
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

function PaletteSubjectChip({ subject }: { subject: TimetableSubjectOption }) {
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
