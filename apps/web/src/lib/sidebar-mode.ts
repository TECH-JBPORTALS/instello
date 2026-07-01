export type SidebarMode = "institution" | "program";

export function getSidebarMode(pathname: string): SidebarMode {
	return /^\/p\/[^/]+/.test(pathname) ? "program" : "institution";
}

export function getProgramAliasFromPath(pathname: string): string | null {
	return pathname.match(/^\/p\/([^/]+)/)?.[1] ?? null;
}

export function getProgramSegment(pathname: string): string | null {
	return pathname.match(/^\/p\/[^/]+\/([^/]+)/)?.[1] ?? null;
}
