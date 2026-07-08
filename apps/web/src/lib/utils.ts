import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const protocol = "https";
export const rootDomain =
	process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localtest.me:3000";

/**
 * Cookie domain shared across all subdomains (e.g. `.instello.in`).
 * Strips any port from `rootDomain` since cookie domains cannot include a port.
 * Mirrors the cross-subdomain cookie domain used by Better Auth.
 */
export const cookieDomain = `.${rootDomain.split(":")[0]}`;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function institutionUrl(slug: string, path = "") {
	return `${protocol}://${slug}.${rootDomain}${path}`;
}
