import { components } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import * as Class from "../../class/model/class";
import * as ClassBatch from "../../class/model/classBatch";
import { ERROR_CODES, throwAppError } from "../../helpers/constants";
import { normalizeSessionConfig } from "../../helpers/timetableSchedule";
import type { AppMutationCtx, AppQueryCtx } from "../../model/common.types";
import * as Program from "../../program/model/program";
import * as Subject from "../../subject/model/subject";
import * as Timetable from "../model/timetable";
import * as TimetableSlot from "../model/timetableSlot";
import type {
	ProgramTimetableListItem,
	TimetableDto,
	TimetableVersionDto,
} from "../validator/timetable";

function splitUserName(name: string): { firstName: string; lastName: string } {
	const trimmed = name.trim();
	const spaceIndex = trimmed.indexOf(" ");
	if (spaceIndex === -1) {
		return { firstName: trimmed, lastName: "" };
	}
	return {
		firstName: trimmed.slice(0, spaceIndex),
		lastName: trimmed.slice(spaceIndex + 1).trim(),
	};
}

/** Resolves a live class by program id + class slug within an institution. */
export async function resolveClass(
	ctx: AppQueryCtx | AppMutationCtx,
	args: {
		programId: Id<"programs">;
		classAlias: string;
		institutionId: string;
	},
) {
	const program = await Program.getById(
		ctx,
		args.programId,
		args.institutionId,
	);

	if (!program) {
		throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
	}

	const cls = await Class.findBySlug(ctx, args.programId, args.classAlias);

	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	return cls;
}

/** Assembles a TimetableDto from a timetable document. */
export async function toDto(
	ctx: AppQueryCtx | AppMutationCtx,
	timetable: Doc<"timetable">,
): Promise<TimetableDto> {
	const cls = await Class.getById(ctx, timetable.classId);
	if (!cls) {
		throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
	}

	const convention = cls.batchNamingConvention ?? "numeric";
	const slots = await TimetableSlot.listByTimetable(ctx, timetable._id);

	const user = await ctx.runQuery(components.betterAuth.users.getById, {
		userId: timetable.createdBy,
	});
	const { firstName, lastName } = splitUserName(user.name);

	const slotDtos = await Promise.all(
		slots.map(async (slot) => {
			const subject = await Subject.getById(ctx, slot.subjectId);
			if (!subject) {
				throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
			}

			let batch:
				| {
						_id: Id<"classBatches">;
						name: string;
						alias: string;
						description: string;
				  }
				| undefined;

			if (slot.batchId) {
				const batchDoc = await ClassBatch.getById(ctx, slot.batchId);
				if (!batchDoc) {
					throwAppError(ERROR_CODES.BATCH.NOT_FOUND);
				}
				const label = ClassBatch.getBatchLabel(batchDoc.numIdx, convention);
				batch = {
					_id: batchDoc._id,
					name: label,
					alias: label,
					description: "",
				};
			}

			return {
				_id: slot._id,
				subject: {
					_id: subject._id,
					name: subject.name,
					code: subject.code,
					alias: subject.alias,
					color: subject.color,
				},
				batch,
				day: slot.day,
				startHour: slot.startHour,
				endHour: slot.endHour,
				room: slot.room,
			};
		}),
	);

	return {
		_id: timetable._id,
		version: timetable.version,
		changeMessage: timetable.changeMessage,
		commitedBy: {
			_id: user._id,
			firstName,
			lastName,
		},
		slots: slotDtos,
		sessionConfig: normalizeSessionConfig(timetable.sessionConfig),
		createdAt: timetable.createdAt,
		updatedAt: timetable.updatedAt,
	};
}

/** Lists version history DTOs for a class, newest first. */
export async function listVersions(
	ctx: AppQueryCtx,
	classId: Id<"classes">,
): Promise<TimetableVersionDto[]> {
	const timetables = await Timetable.listByClass(ctx, classId);

	return await Promise.all(
		timetables.map(async (timetable) => {
			const user = await ctx.runQuery(components.betterAuth.users.getById, {
				userId: timetable.createdBy,
			});
			const { firstName, lastName } = splitUserName(user.name);

			return {
				version: timetable.version,
				changeMessage: timetable.changeMessage,
				commitedBy: {
					_id: user._id,
					firstName,
					lastName,
					...(user.image ? { image: user.image } : {}),
				},
				createdAt: timetable.createdAt,
			};
		}),
	);
}

/** Latest timetable for each class in a program. */
export async function listLatestByProgram(
	ctx: AppQueryCtx,
	args: {
		programId: Id<"programs">;
		institutionId: string;
	},
): Promise<ProgramTimetableListItem[]> {
	const program = await Program.getById(
		ctx,
		args.programId,
		args.institutionId,
	);

	if (!program) {
		throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
	}

	const classes = await Class.listForSwitcher(ctx, {
		programId: args.programId,
	});

	const items = await Promise.all(
		classes.map(async (cls) => {
			const latest = await Timetable.getLatest(ctx, cls._id);
			return {
				class: {
					_id: cls._id,
					name: cls.name,
					slug: cls.slug,
					stage: cls.currentHeadStage,
				},
				timetable: latest ? await toDto(ctx, latest) : null,
			};
		}),
	);

	return items.sort((a, b) => {
		if (a.class.stage.sequenceNumber !== b.class.stage.sequenceNumber) {
			return a.class.stage.sequenceNumber - b.class.stage.sequenceNumber;
		}
		return a.class.name.localeCompare(b.class.name);
	});
}
