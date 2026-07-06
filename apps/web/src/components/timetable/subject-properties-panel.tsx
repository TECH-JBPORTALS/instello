"use client";

import { Button } from "@instello/ui/components/button";
import { Field, FieldLabel } from "@instello/ui/components/field";
import { Input } from "@instello/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Textarea } from "@instello/ui/components/textarea";
import { IconTrash } from "@tabler/icons-react";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import type { TimetableBatchOption } from "@/components/timetable/types";

const WHOLE_CLASS_BATCH_VALUE = "__whole_class__";

export function SubjectPropertiesPanel({
	span,
	batches,
	onUpdateSpan,
	onRemoveSpan,
}: {
	span: HourSpan;
	batches: TimetableBatchOption[];
	onUpdateSpan: (
		patch: Partial<Pick<HourSpan, "room" | "notes" | "batchId">>,
	) => void;
	onRemoveSpan: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 overflow-y-auto p-3">
			<Field>
				<FieldLabel htmlFor="timetable-room">Room</FieldLabel>
				<Input
					id="timetable-room"
					value={span.room}
					onChange={(event) => onUpdateSpan({ room: event.target.value })}
					placeholder="e.g. 101"
				/>
			</Field>

			<Field>
				<FieldLabel htmlFor="timetable-notes">Notes</FieldLabel>
				<Textarea
					id="timetable-notes"
					value={span.notes}
					onChange={(event) => onUpdateSpan({ notes: event.target.value })}
					placeholder="Optional notes for this slot"
					rows={4}
				/>
			</Field>

			<Field>
				<FieldLabel htmlFor="timetable-batch">Batch</FieldLabel>
				<Select
					value={span.batchId ?? WHOLE_CLASS_BATCH_VALUE}
					onValueChange={(value) => {
						if (!value) return;
						onUpdateSpan({
							batchId: value === WHOLE_CLASS_BATCH_VALUE ? undefined : value,
						});
					}}
				>
					<SelectTrigger id="timetable-batch">
						<SelectValue>
							{span.batchId
								? batches.find((batch) => batch.id === span.batchId)?.label
								: "Whole class"}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={WHOLE_CLASS_BATCH_VALUE}>Whole class</SelectItem>
						{batches.map((batch) => (
							<SelectItem key={batch.id} value={batch.id}>
								{batch.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			<Button
				type="button"
				variant="outline"
				className="mt-2 text-destructive hover:text-destructive"
				onClick={onRemoveSpan}
			>
				<IconTrash className="size-4" />
				Remove slot
			</Button>
		</div>
	);
}
