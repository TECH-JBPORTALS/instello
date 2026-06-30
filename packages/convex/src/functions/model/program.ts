import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const CreateSchema = vv
	.doc("programs")
	.pick("name", "alias", "createdBy", "institutionId");

export const CreateInputSchema = {
	name: vv.string(),
	alias: vv.string(),
};

export const PatchNameSchema = vv.object({
	name: vv.string(),
});

export const PatchAliasSchema = vv.object({
	alias: vv.string(),
});

export const ProgramDtoSchema = vv.object({
	_id: vv.id("programs"),
	name: vv.string(),
	alias: vv.string(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
	createdAt: vv.number(),
});

export const ProgramListItemSchema = vv.object({
	_id: vv.id("programs"),
	name: vv.string(),
	alias: vv.string(),
	createdAt: vv.number(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
	user: vv.object({
		_id: vv.string(),
		name: vv.string(),
		email: vv.string(),
		image: vv.nullable(vv.string()),
	}),
});

export type ProgramDto = Infer<typeof ProgramDtoSchema>;
export type ProgramListItem = Infer<typeof ProgramListItemSchema>;

export function toDto(program: Doc<"programs">): ProgramDto {
	return {
		_id: program._id,
		name: program.name,
		alias: program.alias,
		status: program.status,
		createdAt: program.createdAt,
	};
}

export function toListItem(
	program: Doc<"programs">,
	user: { _id: string; name: string; email: string; image: string | null },
): ProgramListItem {
	return {
		_id: program._id,
		name: program.name,
		alias: program.alias,
		createdAt: program.createdAt,
		status: program.status,
		user: {
			_id: user._id,
			name: user.name,
			email: user.email,
			image: user.image,
		},
	};
}

export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof CreateSchema>,
) {
	return await ctx.db.insert("programs", {
		...args,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		status: "active",
	});
}

export async function list(
	ctx: AppQueryCtx,
	args: { institutionId: string; query?: string | null },
): Promise<ProgramListItem[]> {
	let programs: Doc<"programs">[];
	const query = args.query;

	if (query) {
		programs = await ctx.db
			.query("programs")
			.withSearchIndex("search_by_name", (q) =>
				q.search("name", query).eq("institutionId", args.institutionId),
			)
			.take(50);
	} else {
		programs = await ctx.db
			.query("programs")
			.withIndex("by_institution_name", (q) =>
				q.eq("institutionId", args.institutionId),
			)
			.order("asc")
			.take(50);
	}

	return await Promise.all(
		programs.map(async (program) => {
			const user = await ctx.runQuery(components.betterAuth.users.getById, {
				userId: program.createdBy,
			});

			return toListItem(program, user);
		}),
	);
}

export async function getById(
	ctx: AppQueryCtx,
	id: Id<"programs">,
	institutionId?: string,
) {
	const program = await ctx.db.get("programs", id);

	if (!program) return null;
	if (institutionId && program.institutionId !== institutionId) return null;

	return program;
}

export async function patch(
	ctx: AppMutationCtx,
	id: Id<"programs">,
	body: { name?: string; alias?: string },
) {
	return await ctx.db.patch("programs", id, { ...body, updatedAt: Date.now() });
}
