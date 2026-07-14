"use client";

import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	HourSpanCard,
	PaletteSubjectChip,
} from "@/components/timetable/hour-span-card";
import { preferEditorCollision } from "@/components/timetable/prefer-editor-collision";
import { TimetableEditor } from "@/components/timetable/timetable-editor";
import { TimetableSidePanel } from "@/components/timetable/timetable-side-panel";
import type { TimetableEditorController } from "@/components/timetable/use-timetable-editor";

/** Wires DnD context, the hour grid, and the side panel for editing. */
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
