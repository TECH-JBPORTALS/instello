import type { Infer } from "convex/values";
import { FacultyResultSchema } from "#faculty/validator/faculty";
import { vv } from "#schema";

export const ProgramFacultyResult = vv.object({
	_id: vv.id("programFaculty"),
	programId: vv.id("programs"),
	facultyId: vv.id("faculty"),
	isHeadOfProgram: vv.boolean(),
	createdAt: vv.number(),
	faculty: FacultyResultSchema,
});

export type ProgramFacultyResult = Infer<typeof ProgramFacultyResult>;
