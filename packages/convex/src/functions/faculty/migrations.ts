import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

/**
 * Set every faculty record's status to `draft`.
 *
 * Safe to run in both development and production (no SEED_MODE gate).
 *
 * ```bash
 * # development
 * bun x convex run faculty/migrations:setAllStatusToDraft
 *
 * # production
 * bun x convex run faculty/migrations:setAllStatusToDraft --prod
 * ```
 */
export const setAllStatusToDraft = internalMutation({
	args: {
		cursor: v.optional(v.union(v.string(), v.null())),
		batchSize: v.optional(v.number()),
	},
	returns: v.object({
		updated: v.number(),
		isDone: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const batchSize = args.batchSize ?? 100;
		const page = await ctx.db.query("faculty").paginate({
			numItems: batchSize,
			cursor: args.cursor ?? null,
		});

		const now = Date.now();
		let updated = 0;

		for (const faculty of page.page) {
			if (faculty.status === "draft") continue;

			await ctx.db.patch("faculty", faculty._id, {
				status: "draft",
				updatedAt: now,
			});
			updated += 1;
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(
				0,
				internal.faculty.migrations.setAllStatusToDraft,
				{
					cursor: page.continueCursor,
					batchSize,
				},
			);
		}

		console.info(
			`Faculty draft backfill: updated ${updated} in batch (done=${page.isDone})`,
		);

		return { updated, isDone: page.isDone };
	},
});
