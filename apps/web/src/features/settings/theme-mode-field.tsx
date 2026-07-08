"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cookieDomain } from "@/lib/utils";
import { THEME_MODE_COOKIE, type ThemeMode } from "./theme-config";

const MODE_ICONS = {
	light: IconSun,
	dark: IconMoon,
	system: IconDeviceDesktop,
} as const;

/**
 * Persists the selected mode to a cross-subdomain cookie so every subdomain
 * shares it. next-themes only writes to localStorage, which is per-origin.
 */
function persistThemeMode(mode: string) {
	// biome-ignore lint/suspicious/noDocumentCookie: <Setting cookie for cross-subdomain sharing>
	document.cookie = `${THEME_MODE_COOKIE}=${mode};path=/;domain=${cookieDomain};max-age=31536000;samesite=lax`;
}

export function ThemeModeField() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <Skeleton className="min-w-36 h-8" />;
	}

	const currentMode = (theme ?? "system") as ThemeMode;
	const CurrentIcon = MODE_ICONS[currentMode] ?? IconDeviceDesktop;

	return (
		<Select
			value={currentMode}
			onValueChange={(value) => {
				if (value) {
					setTheme(value);
					persistThemeMode(value);
				}
			}}
		>
			<SelectTrigger size="sm" className="min-w-36">
				<CurrentIcon className="size-4 text-muted-foreground" />
				<SelectValue placeholder="Theme" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="light">
					<IconSun className="size-4" />
					Light
				</SelectItem>
				<SelectItem value="dark">
					<IconMoon className="size-4" />
					Dark
				</SelectItem>
				<SelectItem value="system">
					<IconDeviceDesktop className="size-4" />
					System
				</SelectItem>
			</SelectContent>
		</Select>
	);
}
