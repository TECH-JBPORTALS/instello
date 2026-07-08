"use client";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@instello/ui/components/item";
import { ColorSchemeField } from "./color-scheme-field";
import { ThemeModeField } from "./theme-mode-field";

export function AppearanceSection() {
	return (
		<Card className="bg-transparent! shadow-none! ring-0!">
			<CardHeader className="px-0">
				<CardTitle>Appearance</CardTitle>
				<CardDescription>
					Customize how Instello looks on your device
				</CardDescription>
			</CardHeader>
			<ItemGroup variant="stack">
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Theme</ItemTitle>
						<ItemDescription>
							Choose light, dark, or match your system
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ThemeModeField />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Color scheme</ItemTitle>
						<ItemDescription>
							Accent colors inspired by the Instello brand
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ColorSchemeField />
					</ItemActions>
				</Item>
			</ItemGroup>
		</Card>
	);
}
