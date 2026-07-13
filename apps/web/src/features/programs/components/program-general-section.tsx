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
import type { ProgramDto } from "../types";
import { ProgramAliasField, ProgramNameField } from "./program-fields";

type ProgramGeneralSectionProps = {
	program: Pick<ProgramDto, "_id" | "name" | "alias">;
};

export function ProgramGeneralSection({ program }: ProgramGeneralSectionProps) {
	return (
		<Card className="bg-transparent! shadow-none! ring-0!">
			<CardHeader className="px-0">
				<CardTitle>General</CardTitle>
				<CardDescription>
					Basic details for this program. Changing the alias updates program
					URLs going forward.
				</CardDescription>
			</CardHeader>
			<ItemGroup variant="stack">
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Name</ItemTitle>
						<ItemDescription>Display name for this program</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ProgramNameField
							programId={program._id}
							savedValue={program.name}
						/>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Alias</ItemTitle>
						<ItemDescription>
							Short unique identifier used in program URLs
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<ProgramAliasField
							programId={program._id}
							savedValue={program.alias}
						/>
					</ItemActions>
				</Item>
			</ItemGroup>
		</Card>
	);
}
