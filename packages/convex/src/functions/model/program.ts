import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";
import * as Class from "./class";

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

const DELETE_BATCH_SIZE = 40;

export function isLive(program: Doc<"programs">) {
	return program.isDeleting !== true;
}

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

export async function findByAliasIncludingDeleting(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	alias: string,
) {
	return await ctx.db
		.query("programs")
		.withIndex("by_institution_and_alias", (q) =>
			q.eq("institutionId", institutionId).eq("alias", alias),
		)
		.unique();
}

export async function findByAlias(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	alias: string,
) {
	const program = await findByAliasIncludingDeleting(ctx, institutionId, alias);

	if (!program || !isLive(program)) return null;

	return program;
}

export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof CreateSchema>,
) {
	const alias = args.alias.trim();
	const existing = await findByAliasIncludingDeleting(
		ctx,
		args.institutionId,
		alias,
	);

	if (existing) {
		throwAppError(ERROR_CODES.PROGRAM.ALIAS_ALREADY_EXISTS);
	}

	return await ctx.db.insert("programs", {
		...args,
		alias,
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

	const livePrograms = programs.filter(isLive);

	return await Promise.all(
		livePrograms.map(async (program) => {
			const user = await ctx.runQuery(components.betterAuth.users.getById, {
				userId: program.createdBy,
			});

			return toListItem(program, user);
		}),
	);
}

export async function getById(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"programs">,
	institutionId?: string,
) {
	const program = await ctx.db.get("programs", id);

	if (!program) return null;
	if (institutionId && program.institutionId !== institutionId) return null;
	if (!isLive(program)) return null;

	return program;
}

/** Returns the program even when `isDeleting` (for cascade workers). */
export async function getByIdIncludingDeleting(
	ctx: AppQueryCtx | AppMutationCtx,
	id: Id<"programs">,
) {
	return await ctx.db.get("programs", id);
}

export async function patch(
	ctx: AppMutationCtx,
	id: Id<"programs">,
	body: { name?: string; alias?: string },
) {
	if (body.alias !== undefined) {
		const program = await getById(ctx, id);

		if (!program) {
			throwAppError(ERROR_CODES.PROGRAM.NOT_FOUND);
		}

		const alias = body.alias.trim();
		const existing = await findByAliasIncludingDeleting(
			ctx,
			program.institutionId,
			alias,
		);

		if (existing && existing._id !== id) {
			throwAppError(ERROR_CODES.PROGRAM.ALIAS_ALREADY_EXISTS);
		}

		body = { ...body, alias };
	}

	return await ctx.db.patch("programs", id, { ...body, updatedAt: Date.now() });
}

export async function markDeleting(ctx: AppMutationCtx, id: Id<"programs">) {
	await ctx.db.patch("programs", id, {
		isDeleting: true,
		updatedAt: Date.now(),
	});
}

/**
 * Deletes program-related data in bounded batches.
 * Returns `true` when more work remains (caller should reschedule).
 */
export async function deleteCascadeBatch(
	ctx: AppMutationCtx,
	programId: Id<"programs">,
): Promise<boolean> {
	const program = await getByIdIncludingDeleting(ctx, programId);
	if (!program) return false;

	const classes = await ctx.db
		.query("classes")
		.withIndex("by_program", (q) => q.eq("programId", programId))
		.take(1);

	if (classes[0]) {
		await Class.deleteCascadeBatch(ctx, classes[0]._id);
		return true;
	}

	const programSubjects = await ctx.db
		.query("programSubjects")
		.withIndex("by_program_and_stage", (q) => q.eq("programId", programId))
		.take(DELETE_BATCH_SIZE);

	if (programSubjects.length > 0) {
		for (const programSubject of programSubjects) {
			await ctx.db.delete("programSubjects", programSubject._id);
		}
		return true;
	}

	await ctx.db.delete("programs", programId);
	return false;
}
