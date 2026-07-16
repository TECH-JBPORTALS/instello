import { paginationOptsValidator } from "convex/server";
import * as Faculty from "../faculty/model/faculty";
import * as FacultyService from "../faculty/service/faculty";
import { FacultyResultSchema } from "../faculty/validator/faculty";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { insQuery } from "../helpers/customFunctions";
import * as Program from "../program/model/program";
import * as ProgramFaculty from "../program/model/programFaculty";
import * as ProgramSubject from "../program/model/programSubject";
import { vv } from "../schema";
import * as Class from "./model/class";
import * as ClassBatch from "./model/classBatch";
import * as ClassSubjectFaculty from "./model/classSubjectFaculty";
import {
	ClassDtoSchema,
	ClassListItemSchema,
	PaginatedClassListSchema,
} from "./validator/class";
import {
	BatchDtoSchema,
	MoveTargetDtoSchema,
	RemovePreviewSchema,
} from "./validator/classBatch";
import {
	type ClassSubjectListItem,
	ClassSubjectListItemSchema,
	type MyAssignedClassSubjects,
	MyAssignedClassSubjectsSchema,
} from "./validator/classSubjectFaculty";

/** Check if a class name is available in the current program */
export const checkName = insQuery({
	permissions: ["class:create"],
	args: {
		programId: vv.id("programs"),
		name: vv.string(),
	},
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const name = args.name.trim();
		if (!name) return { available: false };

		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		const existing = await Class.findByName(ctx, args.programId, name);

		return { available: existing === null };
	},
});

/** Check if a class slug is available in the current program */
export const checkSlug = insQuery({
	permissions: ["class:create"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
	},
	returns: vv.object({ available: vv.boolean() }),
	handler: async (ctx, args) => {
		const classSlug = args.classSlug.trim();
		if (!classSlug) return { available: false };

		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		let normalizedSlug: string;
		try {
			normalizedSlug = Class.normalizeClassSlugForCheck(classSlug);
		} catch {
			return { available: false };
		}

		const existing = await Class.findBySlug(
			ctx,
			args.programId,
			normalizedSlug,
		);

		return { available: existing === null };
	},
});

/** Get class by slug within a program */
export const getBySlug = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		classSlug: vv.string(),
	},
	returns: ClassDtoSchema,
	handler: async (ctx, args) => {
		const classSlug = args.classSlug.trim();
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		const cls = await Class.findBySlug(ctx, args.programId, classSlug);

		if (!cls) {
			throwAppError(ERROR_CODES.CLASS.NOT_FOUND);
		}

		return await Class.toDto(ctx, cls);
	},
});

/** List classes in the current program (paginated, searchable) */
export const list = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
		paginationOpts: paginationOptsValidator,
		searchQuery: vv.optional(vv.nullable(vv.string())),
	},
	returns: PaginatedClassListSchema,
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return await Class.list(ctx, {
			programId: args.programId,
			query: args.searchQuery,
			paginationOpts: args.paginationOpts,
		});
	},
});

/** List classes for switcher dropdowns (non-paginated, up to 50) */
export const listForSwitcher = insQuery({
	permissions: ["class:view"],
	args: {
		programId: vv.id("programs"),
	},
	returns: vv.array(ClassListItemSchema),
	handler: async (ctx, args) => {
		const program = await Program.getById(
			ctx,
			args.programId,
			ctx.institution._id,
		);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		return await Class.listForSwitcher(ctx, {
			programId: args.programId,
		});
	},
});

/** Get class by id */
export const getById = insQuery({
	permissions: ["class:view"],
	args: {
		id: vv.id("classes"),
	},
	returns: ClassDtoSchema,
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.id,
			ctx.institution._id,
		);

		return await Class.toDto(ctx, cls);
	},
});

/** Lists the batches for a class, with labels computed from the class's naming convention. */
export const listBatches = insQuery({
	permissions: ["class:view"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(BatchDtoSchema),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		return await ClassBatch.listByClass(
			ctx,
			cls._id,
			cls.batchNamingConvention,
		);
	},
});

/** Lists every valid bulk-move destination (batch or class) across the class's program. */
export const listBatchMoveTargets = insQuery({
	permissions: ["student:update"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(MoveTargetDtoSchema),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		return await ClassBatch.listMoveTargets(ctx, cls);
	},
});

/** Preview what happens when deleting a batch (student count and move target). */
export const getBatchRemovePreview = insQuery({
	permissions: ["class:view"],
	args: {
		batchId: vv.id("classBatches"),
	},
	returns: RemovePreviewSchema,
	handler: async (ctx, args) => {
		const batch = await ClassBatch.getByIdIncludingDeleting(ctx, args.batchId);
		if (!batch) {
			throwAppError(ERROR_CODES.BATCH.NOT_FOUND);
		}

		const cls = await Class.ensureInInstitution(
			ctx,
			batch.classId,
			ctx.institution._id,
		);

		if (!cls.isGroupsEnabled) {
			throwAppError(ERROR_CODES.CLASS.BATCHES_NOT_ENABLED);
		}

		return await ClassBatch.getRemovePreview(
			ctx,
			batch,
			cls.batchNamingConvention ?? "numeric",
		);
	},
});

/** Lists subjects for a class's current stage, with assigned faculty */
export const listSubjects = insQuery({
	permissions: ["class:view"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(ClassSubjectListItemSchema),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		const rows = await ctx.db
			.query("programSubjects")
			.withIndex("by_program_and_stage", (q) =>
				q
					.eq("programId", cls.programId)
					.eq("academicStageId", cls.currentHeadStageId),
			)
			.take(300);

		const facultyBySubject =
			await ClassSubjectFaculty.listFacultyByClassProgramSubjects(ctx, {
				classId: cls._id,
				programSubjectIds: rows.map((row) => row._id),
			});

		const items = await Promise.all(
			rows.map(async (row) => {
				const subject = await ctx.db.get("subjects", row.subjectId);
				if (!subject) return null;

				return {
					_id: row._id,
					type: row.type,
					createdAt: row.createdAt,
					subject: {
						_id: subject._id,
						name: subject.name,
						code: subject.code,
						color: subject.color,
						alias: subject.alias,
					},
					faculty: facultyBySubject.get(row._id) ?? [],
				} satisfies ClassSubjectListItem;
			}),
		);

		return items
			.filter((item): item is ClassSubjectListItem => item !== null)
			.sort((a, b) => a.subject.name.localeCompare(b.subject.name));
	},
});

/** List program faculty available for assigning to a class subject */
export const listFacultyForSubjectAssign = insQuery({
	permissions: ["class:update"],
	args: {
		classId: vv.id("classes"),
	},
	returns: vv.array(FacultyResultSchema),
	handler: async (ctx, args) => {
		const cls = await Class.ensureInInstitution(
			ctx,
			args.classId,
			ctx.institution._id,
		);

		const faculty = await ProgramFaculty.listAssigned(ctx, {
			programId: cls.programId,
		});

		return await Promise.all(faculty.map((f) => FacultyService.toDto(ctx, f)));
	},
});

/**
 * Lists subjects assigned to the current faculty member, grouped by class.
 * Matches faculty via the session user's email within the institution.
 */
export const listMyAssignedSubjects = insQuery({
	permissions: ["class:view"],
	args: {},
	returns: vv.array(MyAssignedClassSubjectsSchema),
	handler: async (ctx) => {
		const faculty = await Faculty.findByEmail(
			ctx,
			ctx.institution._id,
			ctx.session.user.email,
		);

		if (!faculty) {
			return [];
		}

		const assignments = await ClassSubjectFaculty.listByFaculty(
			ctx,
			faculty._id,
		);

		const groups = new Map<string, MyAssignedClassSubjects>();

		for (const assignment of assignments) {
			const cls = await ctx.db.get("classes", assignment.classId);
			if (!cls || cls.isDeleting) continue;

			const program = await Program.getById(
				ctx,
				cls.programId,
				ctx.institution._id,
			);
			if (!program) continue;

			const programSubject = await ProgramSubject.getById(
				ctx,
				assignment.programSubjectId,
			);
			if (!programSubject) continue;

			const subject = await ctx.db.get("subjects", programSubject.subjectId);
			if (!subject) continue;

			let group = groups.get(cls._id);
			if (!group) {
				group = {
					classId: cls._id,
					className: cls.name,
					classSlug: cls.slug,
					programAlias: program.alias,
					programName: program.name,
					subjects: [],
				};
				groups.set(cls._id, group);
			}

			group.subjects.push({
				programSubjectId: programSubject._id,
				name: subject.name,
				alias: subject.alias,
				code: subject.code,
				color: subject.color,
				type: programSubject.type,
			});
		}

		return [...groups.values()]
			.map((group) => ({
				...group,
				subjects: group.subjects.sort((a, b) => a.name.localeCompare(b.name)),
			}))
			.sort((a, b) => {
				const byProgram = a.programName.localeCompare(b.programName);
				if (byProgram !== 0) return byProgram;
				return a.className.localeCompare(b.className);
			});
	},
});
