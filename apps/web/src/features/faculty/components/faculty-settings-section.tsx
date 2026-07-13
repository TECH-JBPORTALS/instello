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
import { cn } from "@/lib/utils";
import {
	DateOfBirthField,
	DesignationField,
	EmailField,
	FacultyImageField,
	type FacultySettingsProps,
	FirstNameField,
	JoinedDateField,
	LastNameField,
	PhoneField,
	QualificationField,
	SpecializationField,
	StaffIdField,
} from "./faculty-settings-fields";

export function FacultySettingsSection({ faculty }: FacultySettingsProps) {
	return (
		<div className="space-y-8">
			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Personal</CardTitle>
					<CardDescription>
						Name, date of birth, and profile image for this faculty member
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Profile image</ItemTitle>
							<ItemDescription>Optional profile photo</ItemDescription>
						</ItemContent>
						<ItemActions className="**:data-[slot='faculty-avatar-wrapper']:flex-row-reverse">
							<FacultyImageField
								facultyId={faculty._id}
								firstName={faculty.firstName}
								lastName={faculty.lastName}
								savedImageUrl={faculty.image}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>First name</ItemTitle>
							<ItemDescription>
								Faculty member&apos;s given name
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<FirstNameField
								facultyId={faculty._id}
								savedValue={faculty.firstName}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Last name</ItemTitle>
							<ItemDescription>
								Faculty member&apos;s family name
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<LastNameField
								facultyId={faculty._id}
								savedValue={faculty.lastName}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Date of birth</ItemTitle>
							<ItemDescription>Date of birth on record</ItemDescription>
						</ItemContent>
						<ItemActions>
							<DateOfBirthField
								facultyId={faculty._id}
								savedValue={faculty.dateOfBirth}
							/>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>

			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Contact</CardTitle>
					<CardDescription>Email and phone number</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Email</ItemTitle>
							<ItemDescription>Unique within this institution</ItemDescription>
						</ItemContent>
						<ItemActions>
							<EmailField facultyId={faculty._id} savedValue={faculty.email} />
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Phone number</ItemTitle>
							<ItemDescription className="flex items-center gap-2">
								Primary contact number
								<span
									className={cn(
										"inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
										faculty.phone.verified
											? "bg-primary/10 text-primary"
											: "bg-muted text-muted-foreground",
									)}
								>
									{faculty.phone.verified ? "Verified" : "Not verified"}
								</span>
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<PhoneField
								facultyId={faculty._id}
								savedValue={faculty.phone.number}
							/>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>

			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Employment</CardTitle>
					<CardDescription>
						Staff identification and role details
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Staff ID</ItemTitle>
							<ItemDescription>
								Unique identifier within this institution
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<StaffIdField
								facultyId={faculty._id}
								savedValue={faculty.staffId}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Designation</ItemTitle>
							<ItemDescription>Role or title</ItemDescription>
						</ItemContent>
						<ItemActions>
							<DesignationField
								facultyId={faculty._id}
								savedValue={faculty.designation}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Qualification</ItemTitle>
							<ItemDescription>Highest qualification</ItemDescription>
						</ItemContent>
						<ItemActions>
							<QualificationField
								facultyId={faculty._id}
								savedValue={faculty.qualification}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Specialization</ItemTitle>
							<ItemDescription>Area of expertise</ItemDescription>
						</ItemContent>
						<ItemActions>
							<SpecializationField
								facultyId={faculty._id}
								savedValue={faculty.specialization}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Joined date</ItemTitle>
							<ItemDescription>Date joined the institution</ItemDescription>
						</ItemContent>
						<ItemActions>
							<JoinedDateField
								facultyId={faculty._id}
								savedTimestamp={faculty.joinedDate}
							/>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>
		</div>
	);
}
