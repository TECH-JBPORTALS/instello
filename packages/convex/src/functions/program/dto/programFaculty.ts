/** Program Faculty DTO **/

import type { Doc } from "#_generated/dataModel";
import * as Faculty from "#faculty/model/faculty";
import * as FacultyService from "#faculty/service/faculty";
import type { AppQueryCtx } from "#model/common.types";
import type { ProgramFacultyResult } from "#program/validator/programFaculty";

export const ProgramFacultyDto = {
	to: async (
		ctx: AppQueryCtx,
		programFaculty: Doc<"programFaculty">,
	): Promise<ProgramFacultyResult> => {
		const faculty = await Faculty.findOrThrow(ctx.db, programFaculty.facultyId);

		return {
			_id: programFaculty._id,
			programId: programFaculty.programId,
			facultyId: programFaculty.facultyId,
			isHeadOfProgram: programFaculty.isHeadOfProgram,
			createdAt: programFaculty.createdAt,
			faculty: await FacultyService.toDto(ctx, faculty),
		};
	},
};
