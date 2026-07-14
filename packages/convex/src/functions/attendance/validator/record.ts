import type { Infer } from "convex/values";
import { vv } from "../../schema";
import { AttendanceSessionDtoSchema } from "./session";

export const EntryStatusSchema = vv.union(
	vv.literal("present"),
	vv.literal("absent"),
);

export type EntryStatus = Infer<typeof EntryStatusSchema>;

export const MarkEntryInputSchema = vv.object({
	studentId: vv.id("students"),
	status: EntryStatusSchema,
});

export type MarkEntryInput = Infer<typeof MarkEntryInputSchema>;

export const SessionDetailsEntrySchema = vv.object({
	studentId: vv.id("students"),
	firstName: vv.string(),
	lastName: vv.string(),
	usn: vv.string(),
	status: EntryStatusSchema,
});

export const SessionDetailsDtoSchema = vv.object({
	session: AttendanceSessionDtoSchema,
	register: vv.object({
		subjectName: vv.string(),
		subjectCode: vv.string(),
		subjectColor: vv.string(),
		type: vv.union(vv.literal("theory"), vv.literal("practical")),
		batchLabel: vv.optional(vv.string()),
	}),
	recordId: vv.optional(vv.id("attendanceRecords")),
	presentCount: vv.optional(vv.number()),
	absentCount: vv.optional(vv.number()),
	stats: vv.optional(vv.string()),
	entries: vv.array(SessionDetailsEntrySchema),
	canMark: vv.boolean(),
});

export type SessionDetailsDto = Infer<typeof SessionDetailsDtoSchema>;
