"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { useColorScheme } from "@/providers/color-scheme-provider";
import { ColorSchemeSwatch } from "./color-scheme-swatch";
import { COLOR_SCHEMES } from "./theme-config";

export function ColorSchemeField() {
	const { colorScheme, setColorScheme } = useColorScheme();
	const selected =
		COLOR_SCHEMES.find((scheme) => scheme.value === colorScheme) ??
		COLOR_SCHEMES[0];

	return (
		<Select
			value={colorScheme}
			onValueChange={(value) => {
				if (value === "default" || value === "orange" || value === "yellow") {
					setColorScheme(value);
				}
			}}
		>
			<SelectTrigger size="sm" className="min-w-44">
				<ColorSchemeSwatch preview={selected.preview} />
				<SelectValue placeholder="Color scheme" />
			</SelectTrigger>
			<SelectContent>
				{COLOR_SCHEMES.map((scheme) => (
					<SelectItem key={scheme.value} value={scheme.value}>
						<ColorSchemeSwatch preview={scheme.preview} />
						{scheme.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
