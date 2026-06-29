import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

/**
 * **Create program**
 * @returns programs inside the current institution
 */
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

/**
 * **Lists program**
 * @param query - optional query to search the programs by name
 * @returns programs inside the current institution
 */
export const CreateSchema = vv
	.doc("programs")
	.pick("name", "alias", "createdBy", "institutionId");

export async function list(
	ctx: AppQueryCtx,
	args: { institutionId: string; query?: string | null },
) {
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

	const programsWithUser = await Promise.all(
		programs.map(async (pro) => {
			const user = await ctx.runQuery(components.betterAuth.users.getById, {
				userId: pro.createdBy,
			});

			return {
				_id: pro._id,
				name: pro.name,
				alias: pro.alias,
				createdAt: pro.createdAt,
				status: pro.status,
				user: {
					_id: user._id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			};
		}),
	);

	return programsWithUser;
}

/**
 * **Get program by id**
 * @returns null if program doesn't exists
 */
export async function getById(ctx: AppQueryCtx, id: Id<"programs">) {
	return await ctx.db
		.query("programs")
		.withIndex("by_id", (q) => q.eq("_id", id))
		.first();
}

/**
 * **Update program**
 * @returns nothing
 */
export async function patch(
	ctx: AppMutationCtx,
	id: Id<"programs">,
	body: { name?: string; alias?: string },
) {
	return await ctx.db.patch("programs", id, { ...body, updatedAt: Date.now() });
}
