export type SidebarMode =
	| "institution"
	| "institution-settings"
	| "program"
	| "class";

export function getSidebarMode(pathname: string): SidebarMode {
	if (
		pathname === "/institution-settings" ||
		pathname.startsWith("/institution-settings/")
	) {
		return "institution-settings";
	}
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

export function getInstitutionSettingsProgramId(
	pathname: string,
): string | null {
	return pathname.match(/^\/institution-settings\/p\/([^/]+)/)?.[1] ?? null;
}
