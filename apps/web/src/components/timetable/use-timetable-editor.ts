"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useCallback, useMemo, useState } from "react";
import { applyEditorDrop } from "@/components/timetable/hour-span-drag";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import {
	canPlaceSpan,
	isPaletteDragId,
} from "@/components/timetable/hour-span-utils";
import type {
	SidePanelState,
	TimetableBatchOption,
	TimetableSubjectOption,
} from "@/components/timetable/types";

export interface UseTimetableEditorOptions {
	initialSpans: HourSpan[];
	subjects: TimetableSubjectOption[];
	batches: TimetableBatchOption[];
	numberOfhours?: number;
	days?: number[];
}

export function useTimetableEditor({
	initialSpans,
	subjects,
	batches,
	numberOfhours = 7,
	days = [0, 1, 2, 3, 4, 5],
}: UseTimetableEditorOptions) {
	const [spans, setSpans] = useState<HourSpan[]>(initialSpans);
	const [sidePanel, setSidePanel] = useState<SidePanelState>("palette");
	const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
	const [activeDragId, setActiveDragId] = useState<string | null>(null);

	const selectedSpan = useMemo(
		() => spans.find((span) => span.id === selectedSpanId) ?? null,
		[spans, selectedSpanId],
	);

	const activeDragSpan = useMemo(
		() => spans.find((span) => span.id === activeDragId) ?? null,
		[spans, activeDragId],
	);

	const activeDragSubject = useMemo(() => {
		if (!activeDragId || !isPaletteDragId(activeDragId)) return null;
		const subjectId = activeDragId.slice("palette-".length);
		return subjects.find((subject) => subject.id === subjectId) ?? null;
	}, [activeDragId, subjects]);

	const selectSpan = useCallback((id: string) => {
		setSelectedSpanId(id);
		setSidePanel("properties");
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedSpanId(null);
		setSidePanel("palette");
	}, []);

	const updateSelectedSpan = useCallback(
		(
			patch: Partial<
				Pick<HourSpan, "room" | "notes" | "batchId" | "batchName">
			>,
		) => {
			if (!selectedSpanId) return;
			setSpans((current) =>
				current.map((span) =>
					span.id === selectedSpanId ? { ...span, ...patch } : span,
				),
			);
		},
		[selectedSpanId],
	);

	const removeSelectedSpan = useCallback(() => {
		if (!selectedSpanId) return;
		setSpans((current) => current.filter((span) => span.id !== selectedSpanId));
		clearSelection();
	}, [selectedSpanId, clearSelection]);

	const handleResize = useCallback(
		(id: string, range: { start: number; end: number }) => {
			setSpans((current) => {
				const span = current.find((item) => item.id === id);
				if (!span) return current;

				if (
					!canPlaceSpan(
						current,
						id,
						span.day,
						range.start,
						range.end,
						numberOfhours,
					)
				) {
					return current;
				}

				return current.map((item) =>
					item.id === id
						? { ...item, start: range.start, end: range.end }
						: item,
				);
			});
		},
		[numberOfhours],
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveDragId(String(event.active.id));
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			setActiveDragId(null);
			setSpans((current) => {
				const next = applyEditorDrop(
					current,
					String(event.active.id),
					event.over ? String(event.over.id) : undefined,
					numberOfhours,
					subjects,
				);
				return next ?? current;
			});
		},
		[numberOfhours, subjects],
	);

	const handleDragCancel = useCallback(() => {
		setActiveDragId(null);
	}, []);

	return {
		spans,
		setSpans,
		sidePanel,
		selectedSpan,
		subjects,
		batches,
		numberOfhours,
		days,
		editorProps: {
			data: spans,
			days,
			numberOfhours,
			onResize: handleResize,
			onSpanSelect: selectSpan,
			selectedSpanId,
		},
		sidePanelProps: {
			sidePanel,
			subjects,
			batches,
			selectedSpan,
			onBack: clearSelection,
			onUpdateSpan: updateSelectedSpan,
			onRemoveSpan: removeSelectedSpan,
		},
		dndProps: {
			onDragStart: handleDragStart,
			onDragEnd: handleDragEnd,
			onDragCancel: handleDragCancel,
			activeDragId,
			activeDragSpan,
			activeDragSubject,
		},
	};
}

export type TimetableEditorController = ReturnType<typeof useTimetableEditor>;
