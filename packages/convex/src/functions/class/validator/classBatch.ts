import type { Infer } from "convex/values";
import { vv } from "@/schema";

export const BatchNamingConventionSchema = vv.union(
	vv.literal("numeric"),
	vv.literal("alphabetic"),
);

export const BatchDtoSchema = vv.object({
	_id: vv.id("classBatches"),
	classId: vv.id("classes"),
	numIdx: vv.number(),
	label: vv.string(),
	studentCount: vv.number(),
});

export const RemovePreviewSchema = vv.object({
	batchLabel: vv.string(),
	studentCount: vv.number(),
	canDelete: vv.boolean(),
	hasTimetableConflict: vv.boolean(),
	blockedReason: vv.optional(vv.string()),
	moveToBatch: vv.optional(
		vv.object({
			_id: vv.id("classBatches"),
			label: vv.string(),
		}),
	),
});

export const MoveTargetDtoSchema = vv.object({
	classId: vv.id("classes"),
	className: vv.string(),
	batchId: vv.optional(vv.id("classBatches")),
	batchLabel: vv.optional(vv.string()),
	isCurrentClass: vv.boolean(),
});

export type BatchNamingConvention = Infer<typeof BatchNamingConventionSchema>;
export type BatchDto = Infer<typeof BatchDtoSchema>;
export type RemovePreview = Infer<typeof RemovePreviewSchema>;
export type MoveTargetDto = Infer<typeof MoveTargetDtoSchema>;
