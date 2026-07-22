/** Program Faculty Model **/

import type { PaginationOptions, PaginationResult } from "convex/server";
import type { Doc, Id } from "#_generated/dataModel";
import type { DatabaseReader, DatabaseWriter } from "#_generated/server";
import { ERROR_CODES, throwAppError } from "#helpers/constants";
import type { AppMutationCtx, AppQueryCtx } from "#model/common.types";
import * as Faculty from "../../faculty/model/faculty";

/** Find an existing faculty assignment for a program, or null */
export async function findByProgramAndFaculty(
	db: DatabaseReader,
	programId: Id<"programs">,
	facultyId: Id<"faculty">,
) {
	return await db
		.query("programFaculty")
		.withIndex("by_program_and_faculty", (q) =>
			q.eq("programId", programId).eq("facultyId", facultyId),
		)
		.unique();
}

/**
 * Whether the user is Head of Program for a program in the institution.
 * Used to elevate faculty membership to principal-equivalent permissions.
 */
export async function isHeadOfProgramForUser(
	ctx: { db: DatabaseReader },
	institutionId: string,
	userId: string,
): Promise<boolean> {
	const hopProgram = await getHopProgramForUser(ctx, institutionId, userId);
	return hopProgram !== null;
}

/**
 * The live program where the user is Head of Program, or null.
 * A faculty member can be HOP of at most one program.
 */
export async function getHopProgramForUser(
	ctx: { db: DatabaseReader },
	institutionId: string,
	userId: string,
): Promise<{ _id: Id<"programs">; alias: string; name: string } | null> {
	const faculty = await Faculty.findByInstitutionAndUserId(
		ctx,
		institutionId,
		userId,
	);

	if (!faculty) return null;

	const assignments = await ctx.db
		.query("programFaculty")
		.withIndex("by_faculty", (q) => q.eq("facultyId", faculty._id))
		.take(100);

	for (const assignment of assignments) {
		if (!assignment.isHeadOfProgram) continue;

		const program = await ctx.db.get("programs", assignment.programId);
		if (!program) continue;
		if (program.institutionId !== institutionId) continue;
		if (program.isDeleting === true) continue;

		return {
			_id: program._id,
			alias: program.alias,
			name: program.name,
		};
	}

	return null;
}

/**
 * Designate faculty as the sole Head of Program for a program.
 * Clears any existing HOP on the same program, and clears this faculty's
 * HOP designation on any other program (one HOP program per person).
 */
export async function setAsHeadOfProgram(
	db: DatabaseWriter,
	programId: Id<"programs">,
	facultyId: Id<"faculty">,
) {
	const assignment = await findByProgramAndFaculty(db, programId, facultyId);

	if (!assignment) {
		throwAppError(ERROR_CODES.PROGRAM_FACULTY.NOT_FOUND);
	}

	if (assignment.isHeadOfProgram) {
		return;
	}

	const now = Date.now();
	const programAssignments = await db
		.query("programFaculty")
		.withIndex("by_program", (q) => q.eq("programId", programId))
		.take(300);

	for (const existing of programAssignments) {
		if (existing.isHeadOfProgram) {
			await db.patch(existing._id, {
				isHeadOfProgram: false,
				updatedAt: now,
			});
		}
	}

	const facultyAssignments = await db
		.query("programFaculty")
		.withIndex("by_faculty", (q) => q.eq("facultyId", facultyId))
		.take(100);

	for (const existing of facultyAssignments) {
		if (existing._id === assignment._id) continue;
		if (!existing.isHeadOfProgram) continue;
		await db.patch(existing._id, {
			isHeadOfProgram: false,
			updatedAt: now,
		});
	}

	await db.patch(assignment._id, {
		isHeadOfProgram: true,
		updatedAt: now,
	});
}

/** Remove Head of Program designation from a program faculty assignment */
export async function removeAsHeadOfProgram(
	db: DatabaseWriter,
	programId: Id<"programs">,
	facultyId: Id<"faculty">,
) {
	const assignment = await findByProgramAndFaculty(db, programId, facultyId);

	if (!assignment) {
		throwAppError(ERROR_CODES.PROGRAM_FACULTY.NOT_FOUND);
	}

	if (!assignment.isHeadOfProgram) {
		return;
	}

	await db.patch(assignment._id, {
		isHeadOfProgram: false,
		updatedAt: Date.now(),
	});
}

/** Assign a faculty to the program or return the existing assignment */
export async function assignOrUpdate(
	db: DatabaseWriter,
	programId: Id<"programs">,
	facultyId: Id<"faculty">,
	isHeadOfProgram: boolean,
) {
	const existingProgramFaculty = await findByProgramAndFaculty(
		db,
		programId,
		facultyId,
	);

	if (existingProgramFaculty) {
		return existingProgramFaculty._id;
	}

	return await db.insert("programFaculty", {
		programId,
		facultyId,
		isHeadOfProgram,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});
}

/** Assign multiple faculty to a program; already-assigned faculty are skipped */
export async function assignMany(
	ctx: AppMutationCtx,
	args: {
		programId: Id<"programs">;
		facultyIds: Id<"faculty">[];
	},
): Promise<Id<"programFaculty">[]> {
	const existing = await ctx.db
		.query("programFaculty")
		.withIndex("by_program", (q) => q.eq("programId", args.programId))
		.take(300);

	const assignedFacultyIds = new Set(
		existing.map((assignment) => assignment.facultyId),
	);

	const now = Date.now();
	const insertedIds: Id<"programFaculty">[] = [];

	for (const facultyId of args.facultyIds) {
		if (assignedFacultyIds.has(facultyId)) continue;

		const id = await ctx.db.insert("programFaculty", {
			programId: args.programId,
			facultyId,
			isHeadOfProgram: false,
			createdAt: now,
			updatedAt: now,
		});

		assignedFacultyIds.add(facultyId);
		insertedIds.push(id);
	}

	return insertedIds;
}

/** List faculty IDs already assigned to a program */
export async function listAssignedFacultyIds(
	db: DatabaseReader,
	programId: Id<"programs">,
): Promise<Set<Id<"faculty">>> {
	const assignments = await db
		.query("programFaculty")
		.withIndex("by_program", (q) => q.eq("programId", programId))
		.take(300);

	return new Set(assignments.map((assignment) => assignment.facultyId));
}

/** List institution faculty that can still be assigned to the program */
export async function listAssignable(
	ctx: AppQueryCtx,
	args: {
		institutionId: string;
		programId: Id<"programs">;
		limit?: number;
	},
): Promise<Doc<"faculty">[]> {
	const assignedIds = await listAssignedFacultyIds(ctx.db, args.programId);
	const limit = args.limit ?? 100;

	const faculty = await ctx.db
		.query("faculty")
		.withIndex("by_institution_and_staff_id", (q) =>
			q.eq("institutionId", args.institutionId),
		)
		.order("asc")
		.take(limit + assignedIds.size);

	return faculty.filter((f) => !assignedIds.has(f._id)).slice(0, limit);
}

/** List all program faculty with pagination enabled */
export async function listWithPagination(
	db: DatabaseReader,
	programId: Id<"programs">,
	paginationOpts: PaginationOptions,
): Promise<PaginationResult<Doc<"programFaculty">>> {
	const query = db
		.query("programFaculty")
		.withIndex("by_program", (q) => q.eq("programId", programId));

	return query.paginate(paginationOpts);
}

/** List faculty documents assigned to a program (bounded) */
export async function listAssigned(
	ctx: AppQueryCtx,
	args: {
		programId: Id<"programs">;
		limit?: number;
	},
): Promise<Doc<"faculty">[]> {
	const limit = args.limit ?? 100;
	const assignments = await ctx.db
		.query("programFaculty")
		.withIndex("by_program", (q) => q.eq("programId", args.programId))
		.take(limit);

	const faculty = await Promise.all(
		assignments.map((assignment) =>
			ctx.db.get("faculty", assignment.facultyId),
		),
	);

	return faculty
		.filter((f): f is Doc<"faculty"> => f !== null)
		.sort((a, b) => {
			const nameA = `${a.firstName} ${a.lastName}`.trim();
			const nameB = `${b.firstName} ${b.lastName}`.trim();
			return nameA.localeCompare(nameB);
		});
}

/** Completely remove a faculty from a program */
export async function remove(
	db: DatabaseWriter,
	programFacultyId: Id<"programFaculty">,
) {
	await db.delete(programFacultyId);
}
