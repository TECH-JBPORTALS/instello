import * as v from "valibot";

export const NewClassSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty("Class name is required")),
	description: v.string(),
	currentHeadStageId: v.pipe(
		v.string(),
		v.nonEmpty("Academic stage is required"),
	),
});

export type NewClassFormValues = {
	name: string;
	description: string;
	currentHeadStageId: string;
};
