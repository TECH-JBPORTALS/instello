import {
	type CustomCtx,
	customCtx,
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import type { InsPermission, InsRole } from "../../better-auth/ins-permissions";
import { mutation, query } from "../_generated/server";
import { vv } from "../schema";
import { ensureInsPermission, ensureInstitution, ensureSession } from "./auth";

/**
 * Wrapper for public Convex queries that do not require authentication.
 *
 * Sets `ctx.session` to `null` so handlers can run without an authenticated caller.
 */
export const pubQuery = customQuery(
	query,
	customCtx(async () => {
		return { session: null };
	}),
);

/**
 * Wrapper for public Convex mutations that do not require authentication.
 *
 * Sets `ctx.session` to `null` so handlers can run without an authenticated caller.
 */
export const pubMutation = customMutation(
	mutation,
	customCtx(async () => {
		return { session: null };
	}),
);

/**
 * Wrapper for authenticated Convex queries.
 *
 * Validates the caller's session via {@link ensureSession} before running the handler.
 *
 * @returns Extended context with `ctx.session` for the authenticated user.
 *
 * @example
 * ```ts
 * export const listMyOwned = userQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     return Institution.listByUserRole(ctx, {
 *       role: "owner",
 *       userId: ctx.session.userId,
 *     });
 *   },
 * });
 * ```
 */
export const userQuery = customQuery(
	query,
	customCtx(async (ctx) => {
		const session = await ensureSession(ctx);

		return { session };
	}),
);

/** Context type for handlers registered with {@link userQuery}. */
export type UserQueryCtx = CustomCtx<typeof userQuery>;

/**
 * Wrapper for authenticated Convex mutations.
 *
 * Validates the caller's session via {@link ensureSession} before running the handler.
 *
 * @returns Extended context with `ctx.session` for the authenticated user.
 *
 * @example
 * ```ts
 * export const create = userMutation({
 *   args: { name: vv.string() },
 *   handler: async (ctx, args) => {
 *     return ctx.db.insert("items", {
 *       name: args.name,
 *       userId: ctx.session.userId,
 *     });
 *   },
 * });
 * ```
 */
export const userMutation = customMutation(
	mutation,
	customCtx(async (ctx) => {
		const session = await ensureSession(ctx);

		return { session };
	}),
);

/** Context type for handlers registered with {@link userMutation}. */
export type UserMutationCtx = CustomCtx<typeof userMutation>;

/**
 * Wrapper for institution-scoped Convex queries.
 *
 * Resolves the institution from the required `slug` argument, confirms the caller
 * is a member via {@link ensureInstitution}, and optionally enforces role permissions
 * via {@link ensureInsPermission} before running the handler.
 *
 * The `slug` argument is consumed by this wrapper and is not passed to the handler.
 *
 * @param options.permissions - Institution permissions required for the caller's role.
 *
 * @returns Extended context with `ctx.session`, `ctx.institution`, and `ctx.membership`.
 *
 * @example
 * ```ts
 * export const list = insQuery({
 *   permissions: ["faculty:view"],
 *   args: { paginationOpts: paginationOptsValidator },
 *   handler: async (ctx, args) => {
 *     return Faculty.list(ctx, {
 *       institutionId: ctx.institution._id,
 *       paginationOpts: args.paginationOpts,
 *     });
 *   },
 * });
 * ```
 */
export const insQuery = customQuery(query, {
	args: {
		slug: vv.string(),
	},
	input: async (
		ctx,
		args,
		{ permissions }: { permissions?: InsPermission[] },
	) => {
		const { slug } = args;
		const session = await ensureSession(ctx);

		const { institution, membership } = await ensureInstitution(
			ctx,
			slug,
			session.userId,
		);

		if (permissions) {
			await ensureInsPermission(ctx, {
				role: membership.role as InsRole,
				permissions,
				institutionId: institution._id,
				userId: session.userId,
			});
		}

		return {
			ctx: {
				session,
				institution,
				membership,
			},
			args: {},
		};
	},
});

/** Context type for handlers registered with {@link insQuery}. */
export type InsQueryCtx = CustomCtx<typeof insQuery>;

/**
 * Wrapper for institution-scoped Convex mutations.
 *
 * Resolves the institution from the required `slug` argument, confirms the caller
 * is a member via {@link ensureInstitution}, and optionally enforces role permissions
 * via {@link ensureInsPermission} before running the handler.
 *
 * The `slug` argument is consumed by this wrapper and is not passed to the handler.
 *
 * @param options.permissions - Institution permissions required for the caller's role.
 *
 * @returns Extended context with `ctx.session`, `ctx.institution`, and `ctx.membership`.
 *
 * @example
 * ```ts
 * export const create = insMutation({
 *   permissions: ["faculty:create"],
 *   args: Faculty.CreateInputSchema,
 *   handler: async (ctx, args) => {
 *     return Faculty.create(ctx, {
 *       ...args,
 *       institutionId: ctx.institution._id,
 *       createdBy: ctx.session.userId,
 *     });
 *   },
 * });
 * ```
 */
export const insMutation = customMutation(mutation, {
	args: {
		slug: vv.string(),
	},
	input: async (
		ctx,
		args,
		{ permissions }: { permissions?: InsPermission[] },
	) => {
		const { slug } = args;
		const session = await ensureSession(ctx);

		const { institution, membership } = await ensureInstitution(
			ctx,
			slug,
			session.userId,
		);

		if (permissions) {
			await ensureInsPermission(ctx, {
				role: membership.role as InsRole,
				permissions,
				institutionId: institution._id,
				userId: session.userId,
			});
		}

		return {
			ctx: {
				session,
				institution,
				membership,
			},
			args: {},
		};
	},
});

/** Context type for handlers registered with {@link insMutation}. */
export type InsMutationCtx = CustomCtx<typeof insMutation>;
