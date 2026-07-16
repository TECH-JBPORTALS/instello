/** Class Subject Faculty Model **/

import type { Id } from "#_generated/dataModel";
import type { AppMutationCtx, AppQueryCtx } from "#model/common.types";
import type { ClassSubjectFacultySummary } from "../validator/classSubjectFaculty";

/** Find an existing faculty assignment for a class subject, or null */
export async function findByClassProgramSubjectAndFaculty(
	ctx: AppQueryCtx,
	args: {
		classId: Id<"classes">;
		programSubjectId: Id<"programSubjects">;
		facultyId: Id<"faculty">;
	},
) {
	return await ctx.db
		.query("classSubjectFaculty")
		.withIndex("by_class_program_subject_and_faculty", (q) =>
			q
				.eq("classId", args.classId)
				.eq("programSubjectId", args.programSubjectId)
				.eq("facultyId", args.facultyId),
		)
		.unique();
}

/** List assignment rows for a class + program subject pair */
export async function listByClassAndProgramSubject(
	ctx: AppQueryCtx,
	args: {
		classId: Id<"classes">;
		programSubjectId: Id<"programSubjects">;
	},
) {
	return await ctx.db
		.query("classSubjectFaculty")
		.withIndex("by_class_and_program_subject", (q) =>
			q
				.eq("classId", args.classId)
				.eq("programSubjectId", args.programSubjectId),
		)
		.take(100);
}

/**
 * Resolves assigned faculty summaries for many program subject allocations in a class.
 * Returns a map keyed by programSubjectId.
 */
export async function listFacultyByClassProgramSubjects(
	ctx: AppQueryCtx,
	args: {
		classId: Id<"classes">;
		programSubjectIds: Id<"programSubjects">[];
	},
): Promise<Map<Id<"programSubjects">, ClassSubjectFacultySummary[]>> {
	const result = new Map<Id<"programSubjects">, ClassSubjectFacultySummary[]>();

	for (const id of args.programSubjectIds) {
		result.set(id, []);
	}

	if (args.programSubjectIds.length === 0) {
		return result;
	}

	const facultyCache = new Map<
		Id<"faculty">,
		ClassSubjectFacultySummary | null
	>();

	await Promise.all(
		args.programSubjectIds.map(async (programSubjectId) => {
			const assignments = await listByClassAndProgramSubject(ctx, {
				classId: args.classId,
				programSubjectId,
			});
			const summaries: ClassSubjectFacultySummary[] = [];

			for (const assignment of assignments) {
				let summary = facultyCache.get(assignment.facultyId);

				if (summary === undefined) {
					const faculty = await ctx.db.get("faculty", assignment.facultyId);
					if (!faculty) {
						facultyCache.set(assignment.facultyId, null);
						continue;
					}

					const imageUrl = faculty.image
						? await ctx.storage.getUrl(faculty.image)
						: null;

					summary = {
						_id: faculty._id,
						firstName: faculty.firstName,
						lastName: faculty.lastName,
						image: imageUrl ?? undefined,
					};
					facultyCache.set(assignment.facultyId, summary);
				}

				if (summary) {
					summaries.push(summary);
				}
			}

			result.set(programSubjectId, summaries);
		}),
	);

	return result;
}

/**
 * Assign faculty to a class subject allocation.
 * Idempotent — returns the existing assignment id when already assigned.
 */
export async function assign(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		programSubjectId: Id<"programSubjects">;
		facultyId: Id<"faculty">;
	},
): Promise<Id<"classSubjectFaculty">> {
	const existing = await findByClassProgramSubjectAndFaculty(ctx, args);

	if (existing) {
		return existing._id;
	}

	const now = Date.now();
	return await ctx.db.insert("classSubjectFaculty", {
		classId: args.classId,
		programSubjectId: args.programSubjectId,
		facultyId: args.facultyId,
		createdAt: now,
		updatedAt: now,
	});
}

/** Remove a faculty assignment from a class subject (no-op if missing) */
export async function remove(
	ctx: AppMutationCtx,
	args: {
		classId: Id<"classes">;
		programSubjectId: Id<"programSubjects">;
		facultyId: Id<"faculty">;
	},
): Promise<void> {
	const existing = await findByClassProgramSubjectAndFaculty(ctx, args);

	if (existing) {
		await ctx.db.delete("classSubjectFaculty", existing._id);
	}
}

/** Delete all faculty assignments for a class */
export async function removeAllByClass(
	ctx: AppMutationCtx,
	classId: Id<"classes">,
): Promise<void> {
	const assignments = await ctx.db
		.query("classSubjectFaculty")
		.withIndex("by_class", (q) => q.eq("classId", classId))
		.take(300);

	for (const assignment of assignments) {
		await ctx.db.delete("classSubjectFaculty", assignment._id);
	}
}

/** Delete all faculty assignments for a program subject across classes */
export async function removeAllByProgramSubject(
	ctx: AppMutationCtx,
	programSubjectId: Id<"programSubjects">,
): Promise<void> {
	const assignments = await ctx.db
		.query("classSubjectFaculty")
		.withIndex("by_program_subject", (q) =>
			q.eq("programSubjectId", programSubjectId),
		)
		.take(300);

	for (const assignment of assignments) {
		await ctx.db.delete("classSubjectFaculty", assignment._id);
	}
}

/** Delete all class-subject assignments for a faculty */
export async function removeAllByFaculty(
	ctx: AppMutationCtx,
	facultyId: Id<"faculty">,
): Promise<void> {
	const assignments = await ctx.db
		.query("classSubjectFaculty")
		.withIndex("by_faculty", (q) => q.eq("facultyId", facultyId))
		.take(300);

	for (const assignment of assignments) {
		await ctx.db.delete("classSubjectFaculty", assignment._id);
	}
}

/** List all class-subject assignment rows for a faculty (bounded) */
export async function listByFaculty(
	ctx: AppQueryCtx,
	facultyId: Id<"faculty">,
) {
	return await ctx.db
		.query("classSubjectFaculty")
		.withIndex("by_faculty", (q) => q.eq("facultyId", facultyId))
		.take(300);
}
