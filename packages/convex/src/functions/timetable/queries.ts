import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import * as Program from "../program/model/program";
import { vv } from "../schema";
import * as Timetable from "./model/timetable";
import * as TimetableService from "./service/timetable";
import {
	ProgramTimetableListItemSchema,
	TimetableDtoSchema,
	TimetableVersionDtoSchema,
} from "./validator/timetable";

/** Get latest timetable for class, or null when none exists */
export const getOrNull = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
	},
	returns: vv.union(TimetableDtoSchema, vv.null()),
	handler: async (ctx, args) => {
		const cls = await TimetableService.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		const latest = await Timetable.getLatest(ctx, cls._id);
		if (!latest) {
			return null;
		}

		return await TimetableService.toDto(ctx, latest);
	},
});

/** Get latest timetable for class */
export const get = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
	},
	returns: TimetableDtoSchema,
	handler: async (ctx, args) => {
		const cls = await TimetableService.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		const latest = await Timetable.getLatest(ctx, cls._id);
		if (!latest) {
			throwAppError(ERROR_CODES.TIMETABLE.NOT_FOUND);
		}

		return await TimetableService.toDto(ctx, latest);
	},
});

/** List all timetable versions for a class, newest first */
export const listVersions = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
	},
	returns: vv.array(TimetableVersionDtoSchema),
	handler: async (ctx, args) => {
		const cls = await TimetableService.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		return await TimetableService.listVersions(ctx, cls._id);
	},
});

/** Get timetable for given version number */
export const getByVersion = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
		version: vv.number(),
	},
	returns: TimetableDtoSchema,
	handler: async (ctx, args) => {
		const cls = await TimetableService.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		const timetable = await Timetable.getByVersion(ctx, cls._id, args.version);
		if (!timetable) {
			throwAppError(ERROR_CODES.TIMETABLE.VERSION_NOT_FOUND);
		}

		return await TimetableService.toDto(ctx, timetable);
	},
});

/** List latest timetable for each class in a program */
export const listByProgram = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
	},
	returns: vv.array(ProgramTimetableListItemSchema),
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);
		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return await TimetableService.listLatestByProgram(ctx, {
			programId: args.programId,
			institutionId: ctx.institution._id,
		});
	},
});
