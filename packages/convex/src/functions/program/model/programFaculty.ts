/** Program Faculty Model **/

import type { PaginationOptions, PaginationResult } from "convex/server";
import type { Doc, Id } from "#_generated/dataModel";
import type { DatabaseReader, DatabaseWriter } from "#_generated/server";
import type { AppMutationCtx, AppQueryCtx } from "#model/common.types";

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

/** Completely remove a faculty from a program */
export async function remove(
	db: DatabaseWriter,
	programFacultyId: Id<"programFaculty">,
) {
	await db.delete(programFacultyId);
}
