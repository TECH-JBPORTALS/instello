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
	SubjectAliasField,
	SubjectCodeField,
	SubjectColorField,
	SubjectDescriptionField,
	SubjectNameField,
} from "./subject-settings-fields";

type SubjectSettingsSectionProps = {
	subject: {
		_id: Id<"subjects">;
		name: string;
		code: string;
		alias: string;
		color: string;
		description?: string;
	};
};

export function SubjectSettingsSection({
	subject,
}: SubjectSettingsSectionProps) {
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
						<SubjectColorField
							subjectId={subject._id}
							savedValue={subject.color}
						/>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Subject name</ItemTitle>
						<ItemDescription>Display name in lists and reports</ItemDescription>
					</ItemContent>
					<ItemActions>
						<SubjectNameField
							subjectId={subject._id}
							savedValue={subject.name}
						/>
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
						<SubjectCodeField
							subjectId={subject._id}
							savedValue={subject.code}
						/>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Subject alias</ItemTitle>
						<ItemDescription>URL-friendly identifier</ItemDescription>
					</ItemContent>
					<ItemActions>
						<SubjectAliasField
							subjectId={subject._id}
							savedValue={subject.alias}
						/>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Description</ItemTitle>
						<ItemDescription>
							Optional details about this subject
						</ItemDescription>
						<SubjectDescriptionField
							subjectId={subject._id}
							savedValue={subject.description ?? ""}
						/>
					</ItemContent>
				</Item>
			</ItemGroup>
		</Card>
	);
}
