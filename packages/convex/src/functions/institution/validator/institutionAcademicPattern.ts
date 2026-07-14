import type { Infer } from "convex/values";
import { vv } from "#schema";

export const AdoptedPatternSummarySchema = vv.object({
	_id: vv.id("academicPatterns"),
	name: vv.string(),
	templateKey: vv.optional(
		vv.union(vv.literal("engineering"), vv.literal("diploma")),
	),
});

export type AdoptedPatternSummary = Infer<typeof AdoptedPatternSummarySchema>;
