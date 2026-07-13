export function classPath(
	programAlias: string,
	classSlug: string,
	segment?: string,
) {
	const base = `/p/${programAlias}/c/${classSlug}`;
	if (!segment || segment === "/") return base;
	const clean = segment.replace(/^\//, "");
	return `${base}/${clean}`;
}
