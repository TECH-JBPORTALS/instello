import type { Infer } from "convex/values";
import { vv } from "../../schema";

export const CategoryDtoSchema = vv.object({
	_id: vv.id("institutionStudentCategories"),
	name: vv.string(),
	createdAt: vv.number(),
	updatedAt: vv.number(),
});

export type CategoryDto = Infer<typeof CategoryDtoSchema>;
