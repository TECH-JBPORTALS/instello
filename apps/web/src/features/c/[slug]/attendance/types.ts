import type { api } from "@instello/convex/api";
import type { FunctionReturnType } from "convex/server";

export type AttendanceRegisterDto = FunctionReturnType<
	typeof api.attendance.listRegisters
>[number];

export type AttendanceSessionDto = FunctionReturnType<
	typeof api.attendance.listSessions
>[number]["sessions"][number];

export type AttendanceSessionStatus = AttendanceSessionDto["status"];

export type RegisterCurrentSession = NonNullable<
	AttendanceRegisterDto["currentSession"]
>;

export type SessionDetailsDto = FunctionReturnType<
	typeof api.attendance.getSessionDetails
>;

export type SessionDetailsEntry = SessionDetailsDto["entries"][number];

export type ActivityLogDto = FunctionReturnType<
	typeof api.attendance.listActivityLog
>[number];
