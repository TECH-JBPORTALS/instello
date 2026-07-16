/** Program Faculty Model **/

import type { PaginationOptions, PaginationResult } from "convex/server";
import type { Doc, Id } from "#_generated/dataModel";
import type { DatabaseReader, DatabaseWriter } from "#_generated/server";

/** Assign a faculty to the program or update an existing faculty assignment*/
export async function assignOrUpdate(
	db: DatabaseWriter,
	programId: Id<"programs">,
	facultyId: Id<"faculty">,
	isHeadOfProgram: boolean,
) {
	const existingProgramFaculty = await db
		.query("programFaculty")
		.withIndex("by_program", (q) => q.eq("programId", programId))
		.first();

	if (existingProgramFaculty) {
		await db.patch(existingProgramFaculty._id, {
			isHeadOfProgram,
			updatedAt: Date.now(),
		});

		return existingProgramFaculty;
	}

	const programFaculty = await db.insert("programFaculty", {
		programId,
		facultyId,
		isHeadOfProgram,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	return programFaculty;
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
