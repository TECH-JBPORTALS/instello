import type { Infer } from "convex/values";
import { vv } from "../../schema";
import { SessionStatusSchema } from "./session";

export const RegisterStatusSchema = vv.union(
	vv.literal("active"),
	vv.literal("archived"),
);

export const RegisterActivitySchema = vv.object({
	actor: vv.object({
		_id: vv.string(),
		name: vv.string(),
		image: vv.optional(vv.string()),
	}),
	description: vv.string(),
	updatedAt: vv.number(),
});

export const RegisterCurrentSessionSchema = vv.object({
	status: SessionStatusSchema,
	hourLabel: vv.string(),
	timeRange: vv.string(),
	description: vv.string(),
	inGracePeriod: vv.boolean(),
	sessionDate: vv.string(),
	day: vv.number(),
	startHour: vv.number(),
	endHour: vv.number(),
	stats: vv.optional(vv.string()),
});

export const AttendanceRegisterDtoSchema = vv.object({
	_id: vv.id("attendanceRegisters"),
	classId: vv.id("classes"),
	subjectId: vv.id("subjects"),
	batchId: vv.optional(vv.id("classBatches")),
	status: RegisterStatusSchema,
	subjectName: vv.string(),
	subjectCode: vv.string(),
	subjectColor: vv.string(),
	type: vv.union(vv.literal("theory"), vv.literal("practical")),
	batchLabel: vv.optional(vv.string()),
	activity: vv.optional(RegisterActivitySchema),
	currentSession: vv.optional(RegisterCurrentSessionSchema),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export type AttendanceRegisterDto = Infer<typeof AttendanceRegisterDtoSchema>;
