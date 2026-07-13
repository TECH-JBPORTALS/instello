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
import {
	ClassDescriptionField,
	ClassNameField,
} from "./fields/class-text-fields";

type GeneralSettingsSectionProps = {
	cls: {
		_id: Id<"classes">;
		name: string;
		description?: string;
	};
};

export function GeneralSettingsSection({ cls }: GeneralSettingsSectionProps) {
	return (
		<Card className="bg-transparent! shadow-none! ring-0!">
			<CardHeader className="px-0">
				<CardTitle>General</CardTitle>
				<CardDescription>
					Basic details for this class. Slug and academic stage can&apos;t be
					changed here.
				</CardDescription>
			</CardHeader>
			<ItemGroup variant="stack">
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Name</ItemTitle>
						<ItemDescription>Display name for this class</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ClassNameField classId={cls._id} savedValue={cls.name} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Description</ItemTitle>
						<ItemDescription>Optional details about this class</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ClassDescriptionField
							classId={cls._id}
							savedValue={cls.description ?? ""}
						/>
					</ItemActions>
				</Item>
			</ItemGroup>
		</Card>
	);
}
