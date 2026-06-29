import type { Id } from "../_generated/dataModel";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

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

export async function list(
	ctx: AppQueryCtx,
	args: {
		programId: Id<"programs">;
	},
) {
	return await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", args.programId))
		.take(10);
}

export async function getById(ctx: AppQueryCtx, id: Id<"classes">) {
	return await ctx.db
		.query("classes")
		.withIndex("by_id", (q) => q.eq("_id", id))
		.first();
}

export async function patch(
	ctx: AppMutationCtx,
	id: Id<"classes">,
	body: { name?: string; description?: string },
) {
	return await ctx.db.patch("classes", id, {
		...body,
		updatedAt: Date.now(),
	});
}
