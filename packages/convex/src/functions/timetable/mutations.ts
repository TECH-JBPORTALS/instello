import { insMutation } from "../helpers/customFunctions";
import * as AttendanceRegister from "../attendance/model/register";
import { vv } from "../schema";
import * as Timetable from "./model/timetable";
import * as TimetableService from "./service/timetable";
import {
	SlotInputSchema,
	TimetableDtoSchema,
	TimetableSessionConfigSchema,
} from "./validator/timetable";

/** Create a new timetable version for the class */
export const create = insMutation({
	permissions: ["class:update"],
	args: {
		programId: vv.id("programs"),
		classAlias: vv.string(),
		changeMessage: vv.string(),
		slots: vv.array(SlotInputSchema),
		sessionConfig: vv.optional(TimetableSessionConfigSchema),
	},
	returns: TimetableDtoSchema,
	handler: async (ctx, args) => {
		const cls = await TimetableService.resolveClass(ctx, {
			programId: args.programId,
			classAlias: args.classAlias,
			institutionId: ctx.institution._id,
		});

		const timetable = await Timetable.create(ctx, {
			classId: cls._id,
			institutionId: ctx.institution._id,
			createdBy: ctx.session.userId,
			changeMessage: args.changeMessage,
			slots: args.slots,
			sessionConfig: args.sessionConfig,
		});

		await AttendanceRegister.syncFromTimetable(ctx, {
			classId: cls._id,
			slots: args.slots,
		});

		return await TimetableService.toDto(ctx, timetable);
	},
});
