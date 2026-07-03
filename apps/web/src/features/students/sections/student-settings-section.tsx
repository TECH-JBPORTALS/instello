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
import type { GenderOption } from "../constants";
import { StudentImageField } from "./fields/student-image-field";
import {
	CategoryField,
	GenderField,
	StateField,
} from "./fields/student-select-fields";
import {
	AddressLineField,
	ApaarIdField,
	CityField,
	EmailField,
	FatherNameField,
	FatherPhoneField,
	FirstNameField,
	LastNameField,
	MotherNameField,
	MotherPhoneField,
	PhoneField,
	PostalCodeField,
	UsnField,
} from "./fields/student-text-fields";

type StudentSettingsSectionProps = {
	student: {
		_id: Id<"students">;
		firstName: string;
		lastName: string;
		usn: string;
		email: string;
		gender: GenderOption;
		categoryId: Id<"institutionStudentCategories">;
		phoneNumber: string;
		apaarId?: string;
		image?: string;
		fatherName?: string;
		fatherPhoneNumber?: string;
		motherName?: string;
		motherPhoneNumber?: string;
		addressLine?: string;
		city?: string;
		state?: string;
		postalCode?: string;
	};
};

export function StudentSettingsSection({
	student,
}: StudentSettingsSectionProps) {
	return (
		<div className="space-y-8">
			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Personal</CardTitle>
					<CardDescription>
						Name, gender, and profile image for this student
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Profile image</ItemTitle>
							<ItemDescription>Optional profile photo</ItemDescription>
						</ItemContent>

						<ItemActions className="**:data-[slot='student-avtar-wrapper']:flex-row-reverse">
							<StudentImageField
								studentId={student._id}
								firstName={student.firstName}
								lastName={student.lastName}
								savedImageUrl={student.image}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>First name</ItemTitle>
							<ItemDescription>Student&apos;s given name</ItemDescription>
						</ItemContent>
						<ItemActions>
							<FirstNameField
								studentId={student._id}
								savedValue={student.firstName}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Last name</ItemTitle>
							<ItemDescription>Student&apos;s family name</ItemDescription>
						</ItemContent>
						<ItemActions>
							<LastNameField
								studentId={student._id}
								savedValue={student.lastName}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Gender</ItemTitle>
							<ItemDescription>Student&apos;s gender</ItemDescription>
						</ItemContent>
						<ItemActions>
							<GenderField
								studentId={student._id}
								savedValue={student.gender}
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
							<EmailField studentId={student._id} savedValue={student.email} />
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Phone number</ItemTitle>
							<ItemDescription>Primary contact number</ItemDescription>
						</ItemContent>
						<ItemActions>
							<PhoneField
								studentId={student._id}
								savedValue={student.phoneNumber}
							/>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>

			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Family & Address</CardTitle>
					<CardDescription>
						Parent/guardian contact details and home address
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Father&apos;s name</ItemTitle>
						</ItemContent>
						<ItemActions>
							<FatherNameField
								studentId={student._id}
								savedValue={student.fatherName ?? ""}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Father&apos;s phone number</ItemTitle>
						</ItemContent>
						<ItemActions>
							<FatherPhoneField
								studentId={student._id}
								savedValue={student.fatherPhoneNumber ?? ""}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Mother&apos;s name</ItemTitle>
						</ItemContent>
						<ItemActions>
							<MotherNameField
								studentId={student._id}
								savedValue={student.motherName ?? ""}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Mother&apos;s phone number</ItemTitle>
						</ItemContent>
						<ItemActions>
							<MotherPhoneField
								studentId={student._id}
								savedValue={student.motherPhoneNumber ?? ""}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Address line</ItemTitle>
							<ItemDescription>Building, street, landmark</ItemDescription>
						</ItemContent>
						<ItemActions>
							<AddressLineField
								studentId={student._id}
								savedValue={student.addressLine ?? ""}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>City</ItemTitle>
						</ItemContent>
						<ItemActions>
							<CityField
								studentId={student._id}
								savedValue={student.city ?? ""}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>State</ItemTitle>
						</ItemContent>
						<ItemActions>
							<StateField
								studentId={student._id}
								savedValue={student.state ?? ""}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Postal code</ItemTitle>
							<ItemDescription>Area postal code</ItemDescription>
						</ItemContent>
						<ItemActions>
							<PostalCodeField
								studentId={student._id}
								savedValue={student.postalCode ?? ""}
							/>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>

			<Card className="bg-transparent! shadow-none! ring-0!">
				<CardHeader className="px-0">
					<CardTitle>Academic</CardTitle>
					<CardDescription>
						USN, reservation category, and APAAR ID
					</CardDescription>
				</CardHeader>
				<ItemGroup variant="stack">
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>USN</ItemTitle>
							<ItemDescription>Unique student number</ItemDescription>
						</ItemContent>
						<ItemActions>
							<UsnField studentId={student._id} savedValue={student.usn} />
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>Category</ItemTitle>
							<ItemDescription>
								Reservation / admission category
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<CategoryField
								studentId={student._id}
								savedValue={student.categoryId}
							/>
						</ItemActions>
					</Item>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>APAAR ID</ItemTitle>
							<ItemDescription>Optional 12-digit APAAR code</ItemDescription>
						</ItemContent>
						<ItemActions>
							<ApaarIdField
								studentId={student._id}
								savedValue={student.apaarId ?? ""}
							/>
						</ItemActions>
					</Item>
				</ItemGroup>
			</Card>
		</div>
	);
}
