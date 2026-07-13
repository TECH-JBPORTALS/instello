import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { insMutation, insQuery } from "./helpers/customFunctions";
import * as Timetable from "./model/timetable";
import * as Program from "./program/model/program";
import { vv } from "./schema";

/** Create a new timetable version for the class */
export const create = insMutation({
	permissions: ["class:update"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
		changeMessage: vv.string(),
		slots: vv.array(Timetable.SlotInputSchema),
		sessionConfig: vv.optional(Timetable.TimetableSessionConfigSchema),
	},
	returns: Timetable.TimetableDtoSchema,
	handler: async (ctx, args) => {
		const cls = await Timetable.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		return await Timetable.create(ctx, {
			classId: cls._id,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
			changeMessage: args.changeMessage,
			slots: args.slots,
			sessionConfig: args.sessionConfig,
		});
	},
});

/** Get latest timetable for class, or null when none exists */
export const getOrNull = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
	},
	returns: vv.union(Timetable.TimetableDtoSchema, vv.null()),
	handler: async (ctx, args) => {
		const cls = await Timetable.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		const latest = await Timetable.getLatest(ctx, cls._id);
		if (!latest) {
			return null;
		}

		return await Timetable.toDto(ctx, latest);
	},
});

/** Get latest timetable for class */
export const get = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
	},
	returns: Timetable.TimetableDtoSchema,
	handler: async (ctx, args) => {
		const cls = await Timetable.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		const latest = await Timetable.getLatest(ctx, cls._id);
		if (!latest) {
			throwAppError(ERROR_CODES.TIMETABLE.NOT_FOUND);
		}

		return await Timetable.toDto(ctx, latest);
	},
});

/** List all timetable versions for a class, newest first */
export const listVersions = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
	},
	returns: vv.array(Timetable.TimetableVersionDtoSchema),
	handler: async (ctx, args) => {
		const cls = await Timetable.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		return await Timetable.listVersions(ctx, cls._id);
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
	returns: Timetable.TimetableDtoSchema,
	handler: async (ctx, args) => {
		const cls = await Timetable.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		const timetable = await Timetable.getByVersion(ctx, cls._id, args.version);
		if (!timetable) {
			throwAppError(ERROR_CODES.TIMETABLE.VERSION_NOT_FOUND);
		}

		return await Timetable.toDto(ctx, timetable);
	},
});

/** List latest timetable for each class in a program */
export const listByProgram = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
	},
	returns: vv.array(Timetable.ProgramTimetableListItemSchema),
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);
		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return await Timetable.listLatestByProgram(ctx, {
			programId: args.programId,
			institutionId: ctx.institution._id,
		});
	},
});
