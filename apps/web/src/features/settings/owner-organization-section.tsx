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
	OwnerAddressLineField,
	OwnerCityField,
	OwnerCountryField,
	OwnerNameField,
	OwnerPostalCodeField,
	OwnerStateField,
} from "./owner-org-fields";

type OwnerOrganization = {
	_id: string;
	name: string;
	slug: string;
	addressLine: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
};

type OwnerOrganizationSectionProps = {
	organization: OwnerOrganization;
};

export function OwnerOrganizationSection({
	organization,
}: OwnerOrganizationSectionProps) {
	return (
		<Card className="bg-transparent! shadow-none! ring-0!">
			<CardHeader className="px-0">
				<CardTitle>Organization</CardTitle>
				<CardDescription>
					Manage your owner organization details
				</CardDescription>
			</CardHeader>
			<ItemGroup variant="stack">
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Organization name</ItemTitle>
						<ItemDescription>Legal name of your organization</ItemDescription>
					</ItemContent>
					<ItemActions>
						<OwnerNameField savedValue={organization.name} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Slug</ItemTitle>
						<ItemDescription>
							Your organization URL (cannot be changed)
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<InputGroup className="min-w-3xs">
							<InputGroupAddon>https://</InputGroupAddon>
							<InputGroupInput value={organization.slug} disabled readOnly />
							<InputGroupAddon align="inline-end">.instello.in</InputGroupAddon>
						</InputGroup>
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Street address</ItemTitle>
						<ItemDescription>Official organization address</ItemDescription>
					</ItemContent>
					<ItemActions>
						<OwnerAddressLineField savedValue={organization.addressLine} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>City</ItemTitle>
						<ItemDescription>
							City where the organization is located
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<OwnerCityField savedValue={organization.city} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>State</ItemTitle>
						<ItemDescription>State or province</ItemDescription>
					</ItemContent>
					<ItemActions>
						<OwnerStateField savedValue={organization.state} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Postal code</ItemTitle>
						<ItemDescription>6-digit postal code</ItemDescription>
					</ItemContent>
					<ItemActions>
						<OwnerPostalCodeField savedValue={organization.postalCode} />
					</ItemActions>
				</Item>
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Country</ItemTitle>
						<ItemDescription>Country of registration</ItemDescription>
					</ItemContent>
					<ItemActions>
						<OwnerCountryField savedValue={organization.country} />
					</ItemActions>
				</Item>
			</ItemGroup>
		</Card>
	);
}
