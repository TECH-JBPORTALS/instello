"use client";

import type { Id } from "@instello/convex/dataModel";
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
import { cn } from "@instello/ui/lib/utils";
import type { SystemType } from "../constants";
import { PatternDescriptionField } from "./fields/pattern-description-field";
import { PatternDurationField } from "./fields/pattern-duration-field";
import { PatternNameField } from "./fields/pattern-name-field";
import { PatternSystemTypeField } from "./fields/pattern-system-type-field";

type PatternSettingsSectionProps = {
	pattern: {
		_id: Id<"academicPatterns">;
		name: string;
		description?: string;
		systemType: SystemType;
		durationInYears: number;
		canBeEdited: boolean;
	};
};

export function PatternSettingsSection({
	pattern,
}: PatternSettingsSectionProps) {
	const coreSettingsLocked = !pattern.canBeEdited;

	return (
		<div className="space-y-8">
			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>General</CardTitle>
					<CardDescription>
						Display name and description shown across your organization
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Name</ItemTitle>
							<ItemDescription>
								The display name for this academic pattern
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<PatternNameField
								patternId={pattern._id}
								savedValue={pattern.name}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Description</ItemTitle>
							<ItemDescription>
								Optional details shown alongside the pattern
							</ItemDescription>
							<PatternDescriptionField
								patternId={pattern._id}
								savedValue={pattern.description ?? ""}
							/>
						</ItemContent>
					</Item>
				</ItemGroup>
			</Card>

			<Card
				className={cn(
					"bg-transparent! shadow-none! ring-0!",
					coreSettingsLocked && "opacity-60",
				)}
			>
				<CardHeader className="px-0">
					<CardTitle>Core settings</CardTitle>
					<CardDescription>
						{coreSettingsLocked
							? "System type and duration are locked while an institution uses this pattern"
							: "Define how the program is structured in terms of terms and length"}
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>System type</ItemTitle>
							<ItemDescription>
								Whether the program runs on semesters or annual terms
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<PatternSystemTypeField
								patternId={pattern._id}
								savedValue={pattern.systemType}
								readOnly={coreSettingsLocked}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Duration</ItemTitle>
							<ItemDescription>
								Total number of years in the program
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<PatternDurationField
								patternId={pattern._id}
								savedValue={pattern.durationInYears}
								readOnly={coreSettingsLocked}
							/>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>
		</div>
	);
}
