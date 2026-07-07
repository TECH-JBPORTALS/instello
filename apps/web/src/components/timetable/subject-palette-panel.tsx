"use client";

import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@instello/ui/components/badge";
import { formatPaletteDragId } from "@/components/timetable/hour-span-utils";
import {
	TIMETABLE_SUBJECT_TYPE_LABELS,
	type TimetableSubjectOption,
} from "@/components/timetable/types";
import { cn } from "@/lib/utils";

export function SubjectPalettePanel({
	subjects,
}: {
	subjects: TimetableSubjectOption[];
}) {
	return (
		<div className="flex flex-col gap-2 overflow-y-auto p-3">
			{subjects.map((subject) => (
				<DraggableSubjectItem key={subject.id} subject={subject} />
			))}
		</div>
	);
}

function DraggableSubjectItem({
	subject,
}: {
	subject: TimetableSubjectOption;
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: formatPaletteDragId(subject.id),
	});

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"flex cursor-grab items-center gap-3 rounded-md border bg-background px-3 py-2.5 shadow-sm active:cursor-grabbing",
				isDragging && "opacity-50",
			)}
			{...listeners}
			{...attributes}
		>
			<span
				className="size-3 shrink-0 rounded-full"
				style={{ backgroundColor: subject.color }}
			/>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">{subject.name}</p>
				<div className="flex flex-wrap items-center gap-1.5">
					{subject.code ? (
						<p className="truncate text-xs text-muted-foreground">
							{subject.code}
						</p>
					) : null}
					{subject.type ? (
						<Badge variant="outline" className="h-5 px-1.5 text-[10px]">
							{TIMETABLE_SUBJECT_TYPE_LABELS[subject.type]}
						</Badge>
					) : null}
				</div>
			</div>
			{subject.defaultDuration && subject.defaultDuration > 1 ? (
				<span className="text-xs text-muted-foreground">
					{subject.defaultDuration}h
				</span>
			) : null}
		</div>
	);
}
