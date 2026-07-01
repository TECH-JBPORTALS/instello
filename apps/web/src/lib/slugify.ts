/** Converts a display name into a URL slug (lowercase alphanumeric + hyphens). */
export function slugifyName(name: string): string {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug;
}
