import type { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { nanoid } from "nanoid";
import type { HourSpan } from "@/components/timetable/hour-span-utils";
import {
	createDefaultSessionConfig,
	sessionConfigsEqual,
} from "@/components/timetable/timetable-config-utils";
import type {
	TimetablePublishInfoProps,
	TimetableVersionEntry,
} from "@/components/timetable/timetable-publish-info";
import type {
	TimetableBatchOption,
	TimetableSessionConfig,
	TimetableSubjectOption,
	TimetableSubjectType,
} from "@/components/timetable/types";

export type TimetableDto = NonNullable<
	FunctionReturnType<typeof api.timetable.queries.getOrNull>
>;

export type TimetableVersionDto = FunctionReturnType<
	typeof api.timetable.queries.listVersions
>[number];

type SlotInput = FunctionArgs<
	typeof api.timetable.mutations.create
>["slots"][number];

type ProgramSubjectListItem = FunctionReturnType<
	typeof api.program.queries.listSubjectsByStage
>[number];

type BatchDto = FunctionReturnType<
	typeof api.class.queries.listBatches
>[number];

export function dtoToHourSpans(
	timetable: TimetableDto,
	subjects: TimetableSubjectOption[] = [],
): HourSpan[] {
	const subjectTypeBySubjectId = new Map<string, TimetableSubjectType>();

	for (const subject of subjects) {
		const existing = subjectTypeBySubjectId.get(subject.subjectId);
		if (existing === undefined) {
			if (subject.type) {
				subjectTypeBySubjectId.set(subject.subjectId, subject.type);
			}
			continue;
		}
		if (existing !== subject.type) {
			// Same subject allocated as both theory and practical — ambiguous from slot alone.
			subjectTypeBySubjectId.delete(subject.subjectId);
		}
	}

	return timetable.slots.map((slot) => ({
		id: nanoid(),
		day: slot.day,
		start: slot.startHour,
		end: slot.endHour,
		subjectId: slot.subject._id,
		subject: slot.subject.name,
		subjectType: subjectTypeBySubjectId.get(slot.subject._id),
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

export function mapProgramSubjects(
	items: ProgramSubjectListItem[],
): TimetableSubjectOption[] {
	return items.map((item) => ({
		id: item._id,
		subjectId: item.subject._id,
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

export function sessionConfigEqual(
	current: TimetableSessionConfig,
	initial: TimetableSessionConfig,
): boolean {
	return sessionConfigsEqual(current, initial);
}

export function dtoToSessionConfig(
	timetable: TimetableDto,
): TimetableSessionConfig {
	return timetable.sessionConfig;
}

export { createDefaultSessionConfig };

export function mapVersionSummaries(
	versions: TimetableVersionDto[],
): TimetableVersionEntry[] {
	return versions.map((version) => ({
		version: version.version,
		publisher: {
			name: `${version.commitedBy.firstName} ${version.commitedBy.lastName}`.trim(),
			image: version.commitedBy.image,
		},
		message: version.changeMessage,
		publishedAt: version.createdAt,
	}));
}
