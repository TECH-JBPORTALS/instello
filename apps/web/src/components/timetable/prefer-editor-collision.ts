"use client";

import type { CollisionDetection } from "@dnd-kit/core";
import { pointerWithin } from "@dnd-kit/core";
import { isPaletteDragId } from "@/components/timetable/hour-span-utils";

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
