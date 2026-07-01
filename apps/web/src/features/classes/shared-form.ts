import * as v from "valibot";

const ClassSlugSchema = v.pipe(
	v.string(),
	v.slug("Allowed only alphanumeric characters and hyphens"),
	v.nonEmpty("Class slug is required"),
);

export const NewClassSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty("Class name is required")),
	slug: ClassSlugSchema,
	description: v.string(),
	currentHeadStageId: v.pipe(
		v.string(),
		v.nonEmpty("Academic stage is required"),
	),
});

export type NewClassFormValues = {
	name: string;
	slug: string;
	description: string;
	currentHeadStageId: string;
};

export { ClassSlugSchema };
