"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Button } from "@instello/ui/components/button";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconArrowLeft } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/common/container";
import { cn } from "@/lib/utils";
import { getFacultyDisplayName, getFacultyInitials } from "./forms/shared-form";
import { useCanManageFaculty } from "./hooks/use-can-manage-faculty";
import { AddressSection } from "./sections/address-section";
import { DangerZoneSection } from "./sections/danger-zone-section";
import { PersonalInfoSection } from "./sections/personal-info-section";
import { PhoneSection } from "./sections/phone-section";

export function FacultyDetailPage() {
	const { facultyId } = useParams<{ facultyId: string }>();
	const canManage = useCanManageFaculty();
	const faculty = useQuery(
		api.faculty.getById,
		facultyId ? { id: facultyId as Id<"faculty"> } : "skip",
	);

	if (faculty === undefined) {
		return (
			<Container>
				<FacultyDetailSkeleton />
			</Container>
		);
	}

	const displayName = getFacultyDisplayName(
		faculty.firstName,
		faculty.lastName,
	);

	return (
		<Container>
			<div className="space-y-8">
				<div className="space-y-4">
					<Button
						nativeButton={false}
						variant="ghost"
						className="-ml-2"
						render={<Link href="/faculty" />}
					>
						<IconArrowLeft />
						Back to faculty
					</Button>

					<div className="flex items-center gap-4">
						<Avatar size="xl">
							{faculty.profilePicUrl && (
								<AvatarImage src={faculty.profilePicUrl} alt={displayName} />
							)}
							<AvatarFallback>
								{getFacultyInitials(faculty.firstName, faculty.lastName)}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1">
							<h1 className="text-2xl font-semibold">{displayName}</h1>
							<p className="text-sm text-muted-foreground">{faculty.email}</p>
							<span
								className={cn(
									"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
									faculty.status === "active"
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								{faculty.status}
							</span>
						</div>
					</div>
				</div>

				<div className="mx-auto flex max-w-2xl flex-col gap-6">
					<PersonalInfoSection
						key={`personal-${faculty.updatedAt}`}
						faculty={faculty}
						disabled={!canManage}
					/>
					<AddressSection
						key={`address-${faculty.updatedAt}`}
						faculty={faculty}
						disabled={!canManage}
					/>
					<PhoneSection
						key={`phone-${faculty.updatedAt}`}
						faculty={faculty}
						disabled={!canManage}
					/>
					<DangerZoneSection faculty={faculty} disabled={!canManage} />
				</div>
			</div>
		</Container>
	);
}

function FacultyDetailSkeleton() {
	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<Skeleton className="h-9 w-36" />
				<div className="flex items-center gap-4">
					<Skeleton className="size-14 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-7 w-48" />
						<Skeleton className="h-4 w-56" />
						<Skeleton className="h-5 w-16 rounded-full" />
					</div>
				</div>
			</div>
			<div className="mx-auto flex max-w-2xl flex-col gap-6">
				{Array.from({ length: 4 }).map((_, index) => (
					<Skeleton key={index} className="h-64 w-full rounded-xl" />
				))}
			</div>
		</div>
	);
}
