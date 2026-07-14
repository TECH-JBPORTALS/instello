import type { Doc, Id } from "@/_generated/dataModel";
import type { AppMutationCtx, AppQueryCtx } from "@/model/common.types";
import type { CategoryDto } from "../validator/studentCategory";

export type { CategoryDto } from "../validator/studentCategory";
export { CategoryDtoSchema } from "../validator/studentCategory";

export const DEFAULT_CATEGORY_NAMES = [
	"GM",
	"Cat-1",
	"Cat-IIA",
	"Cat-IIB",
	"Cat-IIIA",
	"Cat-IIIB",
	"SC",
	"ST",
	"Rural",
	"Kannada",
	"KK",
	"NCC",
	"PH",
	"Sports",
	"Ex-Army",
	"SNQ",
] as const;

export function toDto(
	category: Doc<"institutionStudentCategories">,
): CategoryDto {
	return {
		_id: category._id,
		name: category.name,
		createdAt: category.createdAt,
		updatedAt: category.updatedAt,
	};
}

export async function listByInstitution(
	ctx: AppQueryCtx,
	institutionId: string,
): Promise<CategoryDto[]> {
	const categories = await ctx.db
		.query("institutionStudentCategories")
		.withIndex("by_institution", (q) => q.eq("institutionId", institutionId))
		.collect();

	return categories.map(toDto);
}

export async function getById(
	ctx: AppQueryCtx,
	id: Id<"institutionStudentCategories">,
	institutionId?: string,
) {
	const category = await ctx.db.get("institutionStudentCategories", id);

	if (!category) return null;
	if (institutionId && category.institutionId !== institutionId) return null;

	return category;
}

export async function findByName(
	ctx: AppQueryCtx | AppMutationCtx,
	institutionId: string,
	name: string,
) {
	const normalized = name.trim().toLowerCase();
	const categories = await ctx.db
		.query("institutionStudentCategories")
		.withIndex("by_institution", (q) => q.eq("institutionId", institutionId))
		.collect();

	return (
		categories.find((category) => category.name.toLowerCase() === normalized) ??
		null
	);
}

/** Seeds default reservation categories for an institution (idempotent). */
export async function seedDefaults(ctx: AppMutationCtx, institutionId: string) {
	const existing = await ctx.db
		.query("institutionStudentCategories")
		.withIndex("by_institution", (q) => q.eq("institutionId", institutionId))
		.first();

	if (existing) return;

	const now = Date.now();

	for (const name of DEFAULT_CATEGORY_NAMES) {
		await ctx.db.insert("institutionStudentCategories", {
			institutionId,
			name,
			createdAt: now,
			updatedAt: now,
		});
	}
}

/** Ensures categories exist, then returns the full list. */
export async function listOrSeed(
	ctx: AppMutationCtx,
	institutionId: string,
): Promise<CategoryDto[]> {
	await seedDefaults(ctx, institutionId);
	return await listByInstitution(ctx, institutionId);
}
