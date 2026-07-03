/**
 * migrations/backfillStudentBatchIds
 *
 * One-off backfill for `students.batchId`. Copies existing `batchStudents`
 * assignments (created before `students.batchId` was introduced) onto the
 * student documents so per-batch pagination indexes see them. Safe to run
 * multiple times.
 *
 * ```bash
 * # inside packages/convex
 * bun x convex run migrations/backfillStudentBatchIds:run
 * ```
 */

import { internalMutation } from "../_generated/server";
import * as ClassBatch from "../model/classBatch";
import { vv } from "../schema";

export const run = internalMutation({
	args: {},
	returns: vv.object({ patched: vv.number() }),
	handler: async (ctx) => {
		const patched = await ClassBatch.backfillStudentBatchIds(ctx);
		console.info(`✅ Backfilled batchId on ${patched} student(s)`);
		return { patched };
	},
});
