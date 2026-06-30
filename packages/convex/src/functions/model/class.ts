import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const CreateBodySchema = vv.object({
	name: vv.string(),
	description: vv.string(),
	academicYear: vv.number(),
	semester: vv.number(),
});

export const CreateInputSchema = {
	programId: vv.id("programs"),
	body: CreateBodySchema,
};

export const PatchBasicInfoSchema = vv.object({
	name: vv.optional(vv.string()),
	description: vv.optional(vv.string()),
});

export const ClassDtoSchema = vv.object({
	_id: vv.id("classes"),
	name: vv.string(),
	description: vv.optional(vv.string()),
	isGroupsEnabled: vv.boolean(),
	academicYear: vv.number(),
	semester: vv.number(),
	status: vv.union(vv.literal("inactive"), vv.literal("active")),
	createdAt: vv.number(),
	updatedAt: vv.optional(vv.number()),
});

export type ClassDto = Infer<typeof ClassDtoSchema>;

export function toDto(cls: Doc<"classes">): ClassDto {
	return {
		_id: cls._id,
		name: cls.name,
		description: cls.description,
		isGroupsEnabled: cls.isGroupsEnabled,
		academicYear: cls.academicYear,
		semester: cls.semester,
		status: cls.status,
		createdAt: cls.createdAt,
		updatedAt: cls.updatedAt,
	};
}

export async function create(
	ctx: AppMutationCtx,
	args: {
		programId: Id<"programs">;
		body: Infer<typeof CreateBodySchema>;
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
): Promise<ClassDto[]> {
	const classes = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", args.programId))
		.take(10);

	return classes.map(toDto);
}

export async function getById(ctx: AppQueryCtx, id: Id<"classes">) {
	return await ctx.db.get("classes", id);
}

export async function patch(
	ctx: AppMutationCtx,
	id: Id<"classes">,
	body: Infer<typeof PatchBasicInfoSchema>,
) {
	return await ctx.db.patch("classes", id, {
		...body,
		updatedAt: Date.now(),
	});
}
