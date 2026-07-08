"use client";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@instello/ui/components/card";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@instello/ui/components/item";
import {
	InstitutionAddressLineField,
	InstitutionCountryField,
	InstitutionDistrictField,
	InstitutionNameField,
	InstitutionStateField,
	InstitutionZipCodeField,
} from "./institution-fields";

type Institution = {
	_id: string;
	name: string;
	slug: string;
	code: string;
	addressLine: string;
	district: string;
	state: string;
	country: string;
	zipCode: string;
};

export function InstitutionGeneralSection({
	institution,
}: {
	institution: Institution;
}) {
	return (
		<Card className="bg-transparent! shadow-none! ring-0!">
			<CardHeader className="px-0">
				<CardTitle>General</CardTitle>
				<CardDescription>
					Manage institution name and address. Slug and code cannot be changed.
				</CardDescription>
			</CardHeader>
			<ItemGroup variant="stack">
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Institution name</ItemTitle>
						<ItemDescription>Display name for this institution</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InstitutionNameField savedValue={institution.name} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Slug</ItemTitle>
						<ItemDescription>
							Your institution URL (cannot be changed)
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InputGroup className="min-w-3xs">
							<InputGroupAddon>https://</InputGroupAddon>
							<InputGroupInput value={institution.slug} disabled readOnly />
							<InputGroupAddon align="inline-end">.instello.in</InputGroupAddon>
						</InputGroup>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Institution code</ItemTitle>
						<ItemDescription>
							Unique code for this institution (cannot be changed)
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InputGroup className="min-w-3xs">
							<InputGroupInput value={institution.code} disabled readOnly />
						</InputGroup>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Street address</ItemTitle>
						<ItemDescription>Official institution address</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InstitutionAddressLineField savedValue={institution.addressLine} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>District</ItemTitle>
						<ItemDescription>
							District where the institution is located
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InstitutionDistrictField savedValue={institution.district} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>State</ItemTitle>
						<ItemDescription>State or province</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InstitutionStateField savedValue={institution.state} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Postal code</ItemTitle>
						<ItemDescription>6-digit postal code</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InstitutionZipCodeField savedValue={institution.zipCode} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Country</ItemTitle>
						<ItemDescription>Country of registration</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InstitutionCountryField savedValue={institution.country} />
					</ItemActions>
				</Item>
			</ItemGroup>
		</Card>
	);
}
