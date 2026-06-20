import {
	type CustomCtx,
	customCtx,
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import { components } from "~/_generated/api";
import { mutation, query } from "~/_generated/server";
import { ensureInstitution, ensureSession } from "./auth";

/** Public query will just proceed with handler without any authorization checks */
export const pubQuery = customQuery(
	query,
	customCtx(async () => {
		return { session: null };
	}),
);

/** Public mutation will just proceed with handler without any authorization checks */
export const pubMutation = customMutation(
	mutation,
	customCtx(async () => {
		return { session: null };
	}),
);

/**
 * user-scoped query which validates session before proceeding with the query handler
 * @returns context containing extra resolved `session` object
 * @example
 * ```js
 * const get = userQuery({
 * 		args:{id: v.string()},
 * 		handler: (ctx,args)=> {
 *   		return ctx.db
 * 					.query("someTable")
 * 					.withIndex(
 * 						"with_userId_and_id",
 * 						(q)=>q.eq("userId",ctx.session.userId).eq("id",args.id)
 * 					)
 * 		}
 * })
 * ```
 */
export const userQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const session = await ensureSession(ctx);

		return { session };
	}),
);

export type UserQueryCtx = CustomCtx<typeof userQuery>;

/**
 * user-scoped mutation which validates session before proceeding with the mutation handler
 * @returns context containing extra resolved `session` object
 * @example
 * ```js
 * const create = userQuery({
 * 		args:{
 * 				title: v.string(),
 * 				description: string()
 * 			},
 * 		handler: (ctx,args)=> {
 *   		return ctx.db.insert("someTable",{...args,userId: ctx.session.userId})
 * 		}
 * })
 * ```
 */
export const userMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const session = await ensureSession(ctx);

		return { session };
	}),
);

export type UserMutationCtx = CustomCtx<typeof userMutation>;

/**
 * institution-scoped query which validates session before proceeding with the query handler
 * @returns context containing extra resolved `session` object with appended `activeInstitutionId`
 * @example
 * ```js
 * const create = insQuery({
 * 		args:{
 * 			title: v.string(),
 * 			description: string()
 * 		},
 * 		handler: (ctx,args)=> {
 *   		return ctx.db
 * 					.query("someTable")
 * 					.withIndex(
 * 						"by_institutionId",
 * 						(q)=>q.eq("institutionId",ctx.session.activeInstitutionId)
 * 					)
 * 		}
 * })
 * ```
 */
export const insQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const session = await ensureSession(ctx);

		const activeInstitutionId = await ensureInstitution(ctx);

		return {
			session: { ...session, activeInstitutionId },
		};
	}),
);

export type InsQueryCtx = CustomCtx<typeof insQuery>;

/**
 * institution-scoped mutation which validates session before proceeding with the mutation handler
 * @returns context containing extra resolved `session` object with appended `activeInstitutionId`
 * @example
 * ```js
 * const create = insMutation({
 * 		args:{
 * 				title: v.string(),
 * 				description: string()
 * 			},
 * 		handler: async (ctx,args)=> {
 *   		return ctx.db.insert("someTable",{
 * 				...args,
 * 				userId: ctx.session.userId,
 * 				institutionId: ctx.session.activeInstitutionId
 * 			})
 * 		}
 * })
 * ```
 */
export const insMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const session = await ensureSession(ctx);

		const activeInstitutionId = await ensureInstitution(ctx);

		const institution = await ctx.runQuery(
			components.betterAuth.institutions.getById,
			{
				id: activeInstitutionId,
			},
		);

		return {
			session: { ...session, activeInstitutionId },
			institution,
		};
	}),
);

export type InsMutationCtx = CustomCtx<typeof insMutation>;
