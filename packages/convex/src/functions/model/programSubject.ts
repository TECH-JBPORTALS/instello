import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { vv } from "../schema";
import type { AppMutationCtx, AppQueryCtx } from "./common.types";

export const ALLOCATION_TYPES = ["theory", "practical"] as const;

export type AllocationType = (typeof ALLOCATION_TYPES)[number];

const allocationTypeValidator = vv.union(
	vv.literal("theory"),
	vv.literal("practical"),
);

export const AllocateInputSchema = {
	programId: vv.id("programs"),
	academicStageId: vv.id("academicStages"),
	subjectIds: vv.array(vv.id("subjects")),
	type: allocationTypeValidator,
};

export const AllocatableSubjectSchema = vv.object({
	_id: vv.id("subjects"),
	name: vv.string(),
	code: vv.string(),
	color: vv.string(),
	remainingTypes: vv.array(allocationTypeValidator),
});

export const ProgramSubjectListItemSchema = vv.object({
	_id: vv.id("programSubjects"),
	type: allocationTypeValidator,
	createdAt: vv.number(),
	subject: vv.object({
		_id: vv.id("subjects"),
		name: vv.string(),
		code: vv.string(),
		color: vv.string(),
	}),
});

export type AllocatableSubject = Infer<typeof AllocatableSubjectSchema>;
export type ProgramSubjectListItem = Infer<typeof ProgramSubjectListItemSchema>;

function allocationKey(subjectId: Id<"subjects">, type: AllocationType) {
	return `${subjectId}:${type}`;
}

/** Lists subjects allocated to a program for a given academic stage, ordered by subject name. */
export async function listByStage(
	ctx: AppQueryCtx,
	args: {
		programId: Id<"programs">;
		academicStageId: Id<"academicStages">;
	},
): Promise<ProgramSubjectListItem[]> {
	const rows = await ctx.db
		.query("programSubjects")
		.withIndex("by_program_and_stage", (q) =>
			q
				.eq("programId", args.programId)
				.eq("academicStageId", args.academicStageId),
		)
		.take(300);

	const items = await Promise.all(
		rows.map(async (row) => {
			const subject = await ctx.db.get("subjects", row.subjectId);
			if (!subject) return null;

			return {
				_id: row._id,
				type: row.type,
				createdAt: row.createdAt,
				subject: {
					_id: subject._id,
					name: subject.name,
					code: subject.code,
					color: subject.color,
				},
			};
		}),
	);

	return items
		.filter((item): item is ProgramSubjectListItem => item !== null)
		.sort((a, b) => a.subject.name.localeCompare(b.subject.name));
}

/**
 * Lists active institution subjects that still have at least one allocation
 * type available for the given program + academic stage.
 */
export async function listAllocatable(
	ctx: AppQueryCtx,
	args: {
		institutionId: string;
		programId: Id<"programs">;
		academicStageId: Id<"academicStages">;
	},
): Promise<AllocatableSubject[]> {
	const subjects = await ctx.db
		.query("subjects")
		.withIndex("by_institution_name", (q) =>
			q.eq("institutionId", args.institutionId),
		)
		.order("asc")
		.take(300);

	const allocations = await ctx.db
		.query("programSubjects")
		.withIndex("by_program_and_stage", (q) =>
			q
				.eq("programId", args.programId)
				.eq("academicStageId", args.academicStageId),
		)
		.take(300);

	const allocatedTypesBySubject = new Map<
		Id<"subjects">,
		Set<AllocationType>
	>();

	for (const allocation of allocations) {
		const types =
			allocatedTypesBySubject.get(allocation.subjectId) ?? new Set();
		types.add(allocation.type);
		allocatedTypesBySubject.set(allocation.subjectId, types);
	}

	const result: AllocatableSubject[] = [];

	for (const subject of subjects) {
		if (subject.status !== "active") continue;

		const allocated = allocatedTypesBySubject.get(subject._id) ?? new Set();
		const remainingTypes = ALLOCATION_TYPES.filter(
			(type) => !allocated.has(type),
		);

		if (remainingTypes.length === 0) continue;

		result.push({
			_id: subject._id,
			name: subject.name,
			code: subject.code,
			color: subject.color,
			remainingTypes: [...remainingTypes],
		});
	}

	return result;
}

/**
 * Allocates the given subjects to a program's academic stage with the provided type.
 * Subject + type pairs already allocated to that program + stage are skipped.
 */
export async function allocateMany(
	ctx: AppMutationCtx,
	args: {
		programId: Id<"programs">;
		academicStageId: Id<"academicStages">;
		subjectIds: Id<"subjects">[];
		type: AllocationType;
	},
): Promise<Id<"programSubjects">[]> {
	const existing = await ctx.db
		.query("programSubjects")
		.withIndex("by_program_and_stage", (q) =>
			q
				.eq("programId", args.programId)
				.eq("academicStageId", args.academicStageId),
		)
		.take(300);

	const existingKeys = new Set(
		existing.map((allocation) =>
			allocationKey(allocation.subjectId, allocation.type),
		),
	);

	const now = Date.now();
	const insertedIds: Id<"programSubjects">[] = [];

	for (const subjectId of args.subjectIds) {
		const key = allocationKey(subjectId, args.type);
		if (existingKeys.has(key)) continue;

		const id = await ctx.db.insert("programSubjects", {
			programId: args.programId,
			subjectId,
			academicStageId: args.academicStageId,
			type: args.type,
			createdAt: now,
			updatedAt: now,
		});

		existingKeys.add(key);
		insertedIds.push(id);
	}

	return insertedIds;
}

export async function getById(ctx: AppQueryCtx, id: Id<"programSubjects">) {
	return await ctx.db.get("programSubjects", id);
}

export async function removeById(
	ctx: AppMutationCtx,
	id: Id<"programSubjects">,
) {
	await ctx.db.delete("programSubjects", id);
}
