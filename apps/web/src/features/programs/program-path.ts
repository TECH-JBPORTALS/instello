export function programPath(alias: string, segment?: string) {
	const base = `/p/${alias}`;
	if (!segment || segment === "/") return base;
	const clean = segment.replace(/^\//, "");
	return `${base}/${clean}`;
}
