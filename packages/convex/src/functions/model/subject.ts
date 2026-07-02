import type { PaginationOptions } from "convex/server";
import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const SUBJECT_COLOR_PALETTE = [
	"#F97316",
	"#22C55E",
	"#3B82F6",
	"#A855F7",
	"#EC4899",
	"#14B8A6",
	"#EAB308",
	"#6366F1",
	"#EF4444",
	"#F43F5E",
	"#06B6D4",
	"#F59E0B",
] as const;

export const CreateSchema = vv.object({
	name: vv.string(),
	code: vv.string(),
	alias: vv.string(),
	color: vv.optional(vv.string()),
	description: vv.optional(vv.string()),
	institutionId: vv.string(),
});

export const CreateInputSchema = {
	name: vv.string(),
	code: vv.string(),
	alias: vv.string(),
	color: vv.optional(vv.string()),
	description: vv.optional(vv.string()),
};

export const CreateInputObjectSchema = vv.object(CreateInputSchema);

export const PatchNameSchema = vv.object({
	name: vv.string(),
});

export const PatchCodeSchema = vv.object({
	code: vv.string(),
});

export const PatchAliasSchema = vv.object({
	alias: vv.string(),
});

export const PatchColorSchema = vv.object({
	color: vv.string(),
});

export const PatchDescriptionSchema = vv.object({
	description: vv.optional(vv.string()),
});

export const SubjectDtoSchema = vv.object({
	_id: vv.id("subjects"),
	name: vv.string(),
	code: vv.string(),
	alias: vv.string(),
	color: vv.string(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
	description: vv.optional(vv.string()),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export const SubjectListItemSchema = vv.object({
	_id: vv.id("subjects"),
	name: vv.string(),
	code: vv.string(),
	alias: vv.string(),
	color: vv.string(),
	status: vv.union(vv.literal("active"), vv.literal("inactive")),
});

export const PaginatedSubjectListSchema = vv.object({
	page: vv.array(SubjectListItemSchema),
	isDone: vv.boolean(),
	continueCursor: vv.string(),
});

export type SubjectDto = Infer<typeof SubjectDtoSchema>;
export type SubjectListItem = Infer<typeof SubjectListItemSchema>;
export type PaginatedSubjectList = Infer<typeof PaginatedSubjectListSchema>;
export type CreateInput = Infer<typeof CreateInputObjectSchema>;

export function toDto(subject: Doc<"subjects">): SubjectDto {
	return {
		_id: subject._id,
		name: subject.name,
		code: subject.code,
		alias: subject.alias,
		color: subject.color,
		status: subject.status,
		description: subject.description,
		createdAt: subject.createdAt,
		updatedAt: subject.updatedAt,
	};
}

export function toListItem(subject: Doc<"subjects">): SubjectListItem {
	return {
		_id: subject._id,
		name: subject.name,
		code: subject.code,
		alias: subject.alias,
		color: subject.color,
		status: subject.status,
	};
}

export async function findByAlias(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	alias: string,
) {
	return await ctx.db
		.query("subjects")
		.withIndex("by_institution_and_alias", (q) =>
			q.eq("institutionId", institutionId).eq("alias", alias),
		)
		.unique();
}

export async function findByCode(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	code: string,
) {
	return await ctx.db
		.query("subjects")
		.withIndex("by_institution_and_code", (q) =>
			q.eq("institutionId", institutionId).eq("code", code),
		)
		.unique();
}

function defaultColor(name: string): string {
	const hash = name
		.split("")
		.reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return (
		SUBJECT_COLOR_PALETTE[hash % SUBJECT_COLOR_PALETTE.length] ?? "#3B82F6"
	);
}

export async function create(
	ctx: AppMutationCtx,
	args: Infer<typeof CreateSchema>,
) {
	const alias = args.alias.trim();
	const code = args.code.trim().toUpperCase();
	const name = args.name.trim();

	const existingAlias = await findByAlias(ctx, args.institutionId, alias);
	if (existingAlias) {
		throwAppError(ERROR_CODES.SUBJECT.ALIAS_ALREADY_EXISTS);
	}

	const existingCode = await findByCode(ctx, args.institutionId, code);
	if (existingCode) {
		throwAppError(ERROR_CODES.SUBJECT.CODE_ALREADY_EXISTS);
	}

	const now = Date.now();

	return await ctx.db.insert("subjects", {
		name,
		code,
		alias,
		color: args.color ?? defaultColor(name),
		description: args.description,
		institutionId: args.institutionId,
		status: "active",
		createdAt: now,
		updatedAt: now,
	});
}

export async function list(
	ctx: AppQueryCtx,
	args: {
		institutionId: string;
		query?: string | null;
		paginationOpts: PaginationOptions;
	},
): Promise<PaginatedSubjectList> {
	const query = args.query?.trim();

	if (query) {
		const subjects = await ctx.db
			.query("subjects")
			.withSearchIndex("search_by_name", (q) =>
				q.search("name", query).eq("institutionId", args.institutionId),
			)
			.take(50);

		return {
			page: subjects.map(toListItem),
			isDone: true,
			continueCursor: "",
		};
	}

	const result = await ctx.db
		.query("subjects")
		.withIndex("by_institution_name", (q) =>
			q.eq("institutionId", args.institutionId),
		)
		.order("asc")
		.paginate(args.paginationOpts);

	return {
		page: result.page.map(toListItem),
		isDone: result.isDone,
		continueCursor: result.continueCursor,
	};
}

export async function getById(
	ctx: AppQueryCtx,
	id: Id<"subjects">,
	institutionId?: string,
) {
	const subject = await ctx.db.get("subjects", id);

	if (!subject) return null;
	if (institutionId && subject.institutionId !== institutionId) return null;

	return subject;
}

export async function patch(
	ctx: AppMutationCtx,
	id: Id<"subjects">,
	body: {
		name?: string;
		code?: string;
		alias?: string;
		description?: string;
		color?: string;
	},
) {
	const subject = await ctx.db.get("subjects", id);

	if (!subject) {
		throwAppError(ERROR_CODES.SUBJECT.NOT_FOUND);
	}

	const updates: {
		name?: string;
		code?: string;
		alias?: string;
		description?: string;
		color?: string;
		updatedAt: number;
	} = {
		updatedAt: Date.now(),
	};

	if (body.name !== undefined) {
		updates.name = body.name.trim();
	}

	if (body.code !== undefined) {
		const code = body.code.trim().toUpperCase();
		const existing = await findByCode(ctx, subject.institutionId, code);

		if (existing && existing._id !== id) {
			throwAppError(ERROR_CODES.SUBJECT.CODE_ALREADY_EXISTS);
		}

		updates.code = code;
	}

	if (body.alias !== undefined) {
		const alias = body.alias.trim();
		const existing = await findByAlias(ctx, subject.institutionId, alias);

		if (existing && existing._id !== id) {
			throwAppError(ERROR_CODES.SUBJECT.ALIAS_ALREADY_EXISTS);
		}

		updates.alias = alias;
	}

	if (body.description !== undefined) {
		const trimmed = body.description.trim();
		updates.description = trimmed.length > 0 ? trimmed : undefined;
	}

	if (body.color !== undefined) {
		updates.color = body.color;
	}

	return await ctx.db.patch("subjects", id, updates);
}
