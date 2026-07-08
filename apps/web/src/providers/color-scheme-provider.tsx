"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import {
	COLOR_SCHEME_COOKIE,
	type ColorScheme,
} from "@/features/settings/theme-config";
import { cookieDomain } from "@/lib/utils";

type ColorSchemeContextValue = {
	colorScheme: ColorScheme;
	setColorScheme: (scheme: ColorScheme) => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function readSchemeFromDom(): ColorScheme {
	if (typeof document === "undefined") return "default";
	const theme = document.documentElement.dataset.theme;
	if (theme === "orange" || theme === "yellow") return theme;
	return "default";
}

function applyColorScheme(scheme: ColorScheme) {
	if (scheme === "default") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.dataset.theme = scheme;
	}
	document.cookie = `${COLOR_SCHEME_COOKIE}=${scheme};path=/;domain=${cookieDomain};max-age=31536000;samesite=lax`;
}

export function ColorSchemeProvider({
	children,
	initialColorScheme,
}: {
	children: ReactNode;
	initialColorScheme: ColorScheme;
}) {
	const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
		if (typeof document !== "undefined") {
			return readSchemeFromDom();
		}
		return initialColorScheme;
	});

	const setColorScheme = useCallback((scheme: ColorScheme) => {
		setColorSchemeState(scheme);
		applyColorScheme(scheme);
	}, []);

	return (
		<ColorSchemeContext.Provider value={{ colorScheme, setColorScheme }}>
			{children}
		</ColorSchemeContext.Provider>
	);
}

export function useColorScheme() {
	const context = useContext(ColorSchemeContext);
	if (!context) {
		throw new Error("useColorScheme must be used within ColorSchemeProvider");
	}
	return context;
}
