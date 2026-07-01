export type SidebarMode = "institution" | "program" | "class";

export function getSidebarMode(pathname: string): SidebarMode {
	if (/^\/p\/[^/]+\/c\/[^/]+/.test(pathname)) return "class";
	if (/^\/p\/[^/]+/.test(pathname)) return "program";
	return "institution";
}

export function getProgramAliasFromPath(pathname: string): string | null {
	return pathname.match(/^\/p\/([^/]+)/)?.[1] ?? null;
}

export function getClassSlugFromPath(pathname: string): string | null {
	return pathname.match(/^\/p\/[^/]+\/c\/([^/]+)/)?.[1] ?? null;
}

export function getClassSegment(pathname: string): string | null {
	return pathname.match(/^\/p\/[^/]+\/c\/[^/]+\/([^/]+)/)?.[1] ?? null;
}

export function getProgramSegment(pathname: string): string | null {
	if (/^\/p\/[^/]+\/c\//.test(pathname)) return null;
	return pathname.match(/^\/p\/[^/]+\/([^/]+)/)?.[1] ?? null;
}
