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
// import { AliasField } from "./fields/alias-field";
import { CodeField } from "./fields/code-field";
import { ColorField } from "./fields/color-field";
import { DescriptionField } from "./fields/description-field";
import { NameField } from "./fields/name-field";
import type { SubjectSettingsProps } from "./fields/types";

export function SubjectSettingsSection({ subject }: SubjectSettingsProps) {
	return (
		<Card className="bg-transparent! shadow-none! ring-0!">
			<CardHeader className="px-0">
				<CardTitle>Subject information</CardTitle>
				<CardDescription>
					Name, code, alias, color, and description for this subject
				</CardDescription>
			</CardHeader>
			<ItemGroup variant="stack">
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Color</ItemTitle>
						<ItemDescription>
							Avatar color shown across the institution
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ColorField subjectId={subject._id} savedValue={subject.color} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Subject name</ItemTitle>
						<ItemDescription>Display name in lists and reports</ItemDescription>
					</ItemContent>
					<ItemActions>
						<NameField subjectId={subject._id} savedValue={subject.name} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Subject code</ItemTitle>
						<ItemDescription>
							Unique code within this institution
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<CodeField subjectId={subject._id} savedValue={subject.code} />
					</ItemActions>
				</Item>
				{/* <Item variant="outline">
					<ItemContent>
						<ItemTitle>Subject alias</ItemTitle>
						<ItemDescription>URL-friendly identifier</ItemDescription>
					</ItemContent>
					<ItemActions>
						<AliasField subjectId={subject._id} savedValue={subject.alias} />
					</ItemActions>
				</Item> */}
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Description</ItemTitle>
						<ItemDescription>
							Optional details about this subject
						</ItemDescription>
						<DescriptionField
							subjectId={subject._id}
							savedValue={subject.description ?? ""}
						/>
					</ItemContent>
				</Item>
			</ItemGroup>
		</Card>
	);
}
