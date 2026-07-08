export type ColorScheme = "default" | "orange" | "yellow";

export type ThemeMode = "light" | "dark" | "system";

/** Cross-subdomain cookie holding the selected color scheme. */
export const COLOR_SCHEME_COOKIE = "instello-color-scheme";

/**
 * Cross-subdomain cookie holding the selected theme mode.
 * Its value is copied into next-themes' storage before initialization so the
 * chosen mode is shared across every subdomain (localStorage is per-origin).
 */
export const THEME_MODE_COOKIE = "instello-theme";

export type ColorSchemePreview = {
	background: string;
	primary: string;
	foreground: string;
};

export type ColorSchemeOption = {
	value: ColorScheme;
	label: string;
	preview: ColorSchemePreview;
};

export const COLOR_SCHEMES: ColorSchemeOption[] = [
	{
		value: "default",
		label: "Instello Blue",
		preview: {
			background: "oklch(0.99 0.003 248)",
			primary: "oklch(0.49 0.15 255)",
			foreground: "oklch(0.22 0.054 254)",
		},
	},
	{
		value: "orange",
		label: "Sunset Orange",
		preview: {
			background: "oklch(0.99 0.01 70)",
			primary: "oklch(0.70 0.17 55)",
			foreground: "oklch(0.25 0.06 55)",
		},
	},
	{
		value: "yellow",
		label: "Amber Gold",
		preview: {
			background: "oklch(0.99 0.02 95)",
			primary: "oklch(0.80 0.16 90)",
			foreground: "oklch(0.28 0.06 90)",
		},
	},
];

export const THEME_MODES: { value: ThemeMode; label: string }[] = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System" },
];

export function parseColorScheme(value: string | undefined): ColorScheme {
	if (value === "orange" || value === "yellow") return value;
	return "default";
}
