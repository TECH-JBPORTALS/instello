import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const protocol = "https";
export const rootDomain =
	process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localtest.me:3000";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
