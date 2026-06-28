import type { Id } from "../_generated/dataModel";
import type { AppMutationCtx } from "./common.types";

export async function create(
	ctx: AppMutationCtx,
	args: {
		programId: Id<"programs">;
		body: {
			name: string;
			description: string;
			academicYear: number;
			semester: number;
		};
	},
) {
	return await ctx.db.insert("classes", {
		programId: args.programId,
		name: args.body.name,
		description: args.body.description,
		academicYear: args.body.academicYear,
		semester: args.body.semester,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		status: "active",
		isGroupsEnabled: false,
	});
}
