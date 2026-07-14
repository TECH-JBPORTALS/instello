import type { Infer } from "convex/values";
import { vv } from "#schema";

export const SessionStatusSchema = vv.union(
	vv.literal("upcoming"),
	vv.literal("ongoing"),
	vv.literal("completed"),
	vv.literal("missed"),
);

export type SessionStatus = Infer<typeof SessionStatusSchema>;

export const SessionActorSchema = vv.object({
	_id: vv.optional(vv.string()),
	name: vv.string(),
	image: vv.optional(vv.string()),
});

export const AttendanceSessionDtoSchema = vv.object({
	sessionKey: vv.string(),
	sessionDate: vv.string(),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	hourLabel: vv.string(),
	timeRange: vv.string(),
	status: SessionStatusSchema,
	recordId: vv.optional(vv.id("attendanceRecords")),
	actor: vv.optional(SessionActorSchema),
	description: vv.string(),
	stats: vv.optional(vv.string()),
	updatedAt: vv.optional(vv.number()),
	inGracePeriod: vv.boolean(),
});

export const AttendanceSessionGroupSchema = vv.object({
	id: vv.string(),
	label: vv.string(),
	sessions: vv.array(AttendanceSessionDtoSchema),
});

export type AttendanceSessionDto = Infer<typeof AttendanceSessionDtoSchema>;
export type AttendanceSessionGroup = Infer<typeof AttendanceSessionGroupSchema>;
