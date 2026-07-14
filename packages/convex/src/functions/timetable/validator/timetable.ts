import type { Infer } from "convex/values";
import { ClassStageSummarySchema } from "#class/validator/class";
import { vv } from "#schema";

export const PeriodTimeSchema = vv.object({
	startTime: vv.number(),
	endTime: vv.number(),
});

export const LunchBreakSchema = vv.object({
	enabled: vv.boolean(),
	afterPeriod: vv.number(),
	startTime: vv.number(),
	endTime: vv.number(),
});

export const TimetableSessionConfigSchema = vv.object({
	totalHours: vv.number(),
	periods: vv.array(PeriodTimeSchema),
	lunchBreak: vv.optional(LunchBreakSchema),
});

export type TimetableSessionConfig = Infer<typeof TimetableSessionConfigSchema>;

export const SlotInputSchema = vv.object({
	subjectId: vv.id("subjects"),
	batchId: vv.optional(vv.id("classBatches")),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	room: vv.optional(vv.string()),
});

export type SlotInput = Infer<typeof SlotInputSchema>;

export const TimetableSlotDtoSchema = vv.object({
	_id: vv.id("timetableSlots"),
	subject: vv.object({
		_id: vv.id("subjects"),
		name: vv.string(),
		code: vv.string(),
		alias: vv.string(),
		color: vv.string(),
	}),
	batch: vv.optional(
		vv.object({
			_id: vv.id("classBatches"),
			name: vv.string(),
			alias: vv.string(),
			description: vv.string(),
		}),
	),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	room: vv.optional(vv.string()),
});

export const TimetableDtoSchema = vv.object({
	_id: vv.id("timetable"),
	version: vv.number(),
	changeMessage: vv.string(),
	commitedBy: vv.object({
		_id: vv.string(),
		firstName: vv.string(),
		lastName: vv.string(),
	}),
	slots: vv.array(TimetableSlotDtoSchema),
	sessionConfig: TimetableSessionConfigSchema,
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export type TimetableDto = Infer<typeof TimetableDtoSchema>;

export const ProgramTimetableListItemSchema = vv.object({
	class: vv.object({
		_id: vv.id("classes"),
		name: vv.string(),
		slug: vv.string(),
		stage: ClassStageSummarySchema,
	}),
	timetable: vv.union(TimetableDtoSchema, vv.null()),
});

export type ProgramTimetableListItem = Infer<
	typeof ProgramTimetableListItemSchema
>;

export const TimetableVersionDtoSchema = vv.object({
	version: vv.number(),
	changeMessage: vv.string(),
	commitedBy: vv.object({
		_id: vv.string(),
		firstName: vv.string(),
		lastName: vv.string(),
		image: vv.optional(vv.string()),
	}),
	createdAt: vv.number(),
});

export type TimetableVersionDto = Infer<typeof TimetableVersionDtoSchema>;
