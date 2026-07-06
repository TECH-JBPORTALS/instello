import type { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { nanoid } from "nanoid";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import type { TimetableItem } from "@/components/timetable/timetable-display";
import type { TimetablePublishInfoProps } from "@/components/timetable/timetable-publish-info";
import type {
	TimetableBatchOption,
	TimetableSubjectOption,
} from "@/components/timetable/types";

export type TimetableDto = NonNullable<
	FunctionReturnType<typeof api.timetables.getOrNull>
>;

type SlotInput = FunctionArgs<typeof api.timetables.create>["slots"][number];

type ProgramSubjectListItem = FunctionReturnType<
	typeof api.programSubjects.listByStage
>[number];

type BatchDto = FunctionReturnType<typeof api.classBatches.list>[number];

export function dtoToHourSpans(
	timetable: TimetableDto,
	subjects: TimetableSubjectOption[] = [],
): HourSpan[] {
	const subjectTypeById = new Map(
		subjects.map((subject) => [subject.id, subject.type]),
	);

	return timetable.slots.map((slot) => ({
		id: nanoid(),
		day: slot.day,
		start: slot.startHour,
		end: slot.endHour,
		subjectId: slot.subject._id,
		subject: slot.subject.name,
		subjectType: subjectTypeById.get(slot.subject._id),
		room: slot.room ?? "",
		notes: "",
		color: slot.subject.color,
		batchId: slot.batch?._id,
		batchName: slot.batch?.name,
	}));
}

export function hourSpansToSlotInputs(spans: HourSpan[]): SlotInput[] {
	return spans.map((span) => ({
		subjectId: span.subjectId as Id<"subjects">,
		day: span.day,
		startHour: span.start,
		endHour: span.end,
		...(span.batchId ? { batchId: span.batchId as Id<"classBatches"> } : {}),
		...(span.room.trim() ? { room: span.room.trim() } : {}),
	}));
}

function normalizeSlotInputs(slots: SlotInput[]) {
	return [...slots]
		.map((slot) => ({
			subjectId: slot.subjectId,
			day: slot.day,
			startHour: slot.startHour,
			endHour: slot.endHour,
			batchId: slot.batchId ?? null,
			room: slot.room ?? "",
		}))
		.sort(
			(left, right) =>
				left.day - right.day ||
				left.startHour - right.startHour ||
				left.subjectId.localeCompare(right.subjectId),
		);
}

export function hourSpansEqual(
	current: HourSpan[],
	initial: HourSpan[],
): boolean {
	return (
		JSON.stringify(normalizeSlotInputs(hourSpansToSlotInputs(current))) ===
		JSON.stringify(normalizeSlotInputs(hourSpansToSlotInputs(initial)))
	);
}

export function dtoToTimetableItems(timetable: TimetableDto): TimetableItem[] {
	return timetable.slots.map((slot) => ({
		day: slot.day,
		startHour: slot.startHour,
		endHour: slot.endHour,
		subject: slot.subject.name,
		room: slot.room,
		batch: slot.batch?.name,
		color: slot.subject.color,
	}));
}

export function mapProgramSubjects(
	items: ProgramSubjectListItem[],
): TimetableSubjectOption[] {
	return items.map((item) => ({
		id: item.subject._id,
		name: item.subject.name,
		code: item.subject.code,
		color: item.subject.color,
		type: item.type,
	}));
}

export function mapBatches(batches: BatchDto[]): TimetableBatchOption[] {
	return batches.map((batch) => ({
		id: batch._id,
		label: batch.label,
	}));
}

export function dtoToPublishInfo(
	timetable: TimetableDto,
): TimetablePublishInfoProps {
	const { commitedBy } = timetable;
	return {
		publisher: {
			name: `${commitedBy.firstName} ${commitedBy.lastName}`.trim(),
		},
		message: timetable.changeMessage,
		publishedAt: timetable.createdAt,
		currentVersion: timetable.version,
		totalVersions: timetable.version,
	};
}
