import { components } from "#_generated/api";
import type { Id } from "#_generated/dataModel";
import type { AppMutationCtx, AppQueryCtx } from "#model/common.types";
import { splitUserName } from "../helpers";
import type { ActivityChange, ActivityLogDto } from "../validator/activity";
import type { EntryStatus } from "../validator/record";

/** Append a new activity log for a record. */
export async function appendLog(
	ctx: AppMutationCtx,
	args: {
		recordId: Id<"attendanceRecords">;
		action: "marked" | "updated";
		performedBy: string;
		performedAt: number;
		changes: ActivityChange[];
	},
) {
	await ctx.db.insert("attendanceActivityLogs", {
		recordId: args.recordId,
		action: args.action,
		performedBy: args.performedBy,
		performedAt: args.performedAt,
		changes: args.changes,
	});
}

/** Get latest activity log for a record. */
export async function getLatestForRecord(
	ctx: AppQueryCtx | AppMutationCtx,
	recordId: Id<"attendanceRecords">,
) {
	const logs = await ctx.db
		.query("attendanceActivityLogs")
		.withIndex("by_record", (q) => q.eq("recordId", recordId))
		.order("desc")
		.take(1);

	return logs[0];
}

/** List activity logs for a record. */
export async function listByRecord(
	ctx: AppQueryCtx | AppMutationCtx,
	recordId: Id<"attendanceRecords">,
): Promise<ActivityLogDto[]> {
	const logs = await ctx.db
		.query("attendanceActivityLogs")
		.withIndex("by_record", (q) => q.eq("recordId", recordId))
		.order("desc")
		.collect();

	return await Promise.all(
		logs.map(async (log) => {
			const user = await ctx.runQuery(components.betterAuth.users.getById, {
				userId: log.performedBy,
			});
			const { firstName, lastName } = splitUserName(user.name);

			return {
				_id: log._id,
				recordId: log.recordId,
				action: log.action,
				performedBy: {
					_id: user._id,
					name: `${firstName} ${lastName}`.trim(),
					...(user.image ? { image: user.image } : {}),
				},
				performedAt: log.performedAt,
				changes: log.changes,
			};
		}),
	);
}

/** Build the changes array for an activity log. */
export function buildChanges(args: {
	entries: Array<{ studentId: Id<"students">; status: EntryStatus }>;
	previousByStudentId: Map<Id<"students">, EntryStatus>;
	isCreate: boolean;
}): ActivityChange[] {
	if (args.isCreate) {
		return args.entries.map((entry) => ({
			studentId: entry.studentId,
			newStatus: entry.status,
		}));
	}

	const changes: ActivityChange[] = [];
	for (const entry of args.entries) {
		const previousStatus = args.previousByStudentId.get(entry.studentId);
		if (previousStatus === undefined || previousStatus !== entry.status) {
			changes.push({
				studentId: entry.studentId,
				...(previousStatus !== undefined ? { previousStatus } : {}),
				newStatus: entry.status,
			});
		}
	}
	return changes;
}

/** Build the summary for an activity log - an internal DTO function. */
export async function toActivitySummary(
	_ctx: AppQueryCtx | AppMutationCtx,
	log: ActivityLogDto,
): Promise<{
	description: string;
	actor: ActivityLogDto["performedBy"];
	updatedAt: number;
}> {
	const changedCount = log.changes.length;
	const description =
		log.action === "marked"
			? `Marked attendance for ${changedCount} student${changedCount === 1 ? "" : "s"}`
			: `Updated attendance for ${changedCount} student${changedCount === 1 ? "" : "s"}`;

	return {
		description,
		actor: log.performedBy,
		updatedAt: log.performedAt,
	};
}
