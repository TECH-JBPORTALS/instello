import { pixelBasedPreset, type TailwindConfig } from "react-email";

/**
 * Light-theme brand tokens mapped from `packages/ui` globals.css to email-safe hex.
 * Email clients do not reliably support oklch.
 */
export const emailColors = {
	background: "#fbfdff",
	foreground: "#061b33",
	primary: "#1560b3",
	primaryForeground: "#f4f8fd",
	muted: "#f1f3f3",
	mutedForeground: "#67787c",
	border: "#e3e7e8",
	secondary: "#f4f4f5",
	secondaryForeground: "#18181b",
} as const;

export const emailFontFamily = "Source Sans 3";

export const emailFontWeb = {
	url: "https://fonts.gstatic.com/s/sourcesans3/v18/nwpBtKy2OAdR1K-IwhWudF-R9QixQfCw.woff2",
	format: "woff2" as const,
};

export const emailTailwindConfig: TailwindConfig = {
	presets: [pixelBasedPreset],
	theme: {
		extend: {
			colors: {
				background: emailColors.background,
				foreground: emailColors.foreground,
				primary: emailColors.primary,
				"primary-foreground": emailColors.primaryForeground,
				muted: emailColors.muted,
				"muted-foreground": emailColors.mutedForeground,
				border: emailColors.border,
				secondary: emailColors.secondary,
				"secondary-foreground": emailColors.secondaryForeground,
			},
			fontFamily: {
				sans: [`"${emailFontFamily}"`, "Helvetica", "Arial", "sans-serif"],
			},
		},
	},
};
