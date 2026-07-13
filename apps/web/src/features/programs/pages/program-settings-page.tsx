"use client";

import { api } from "@instello/convex/api";
import type { Id } from "@instello/convex/dataModel";
import { Skeleton } from "@instello/ui/components/skeleton";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { notFound, useParams } from "next/navigation";
import { useEffect } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { ProgramDangerZoneSection } from "../components/program-danger-zone-section";
import { ProgramGeneralSection } from "../components/program-general-section";

export function ProgramSettingsPage() {
	const params = useParams<{ programId: string }>();
	const programId = params.programId as Id<"programs">;
	const institutionSlug = useInstitutionSlug();
	const convex = useConvex();
	const program = useInsQuery(
		api.program.queries.getById,
		programId ? { id: programId } : "skip",
	);

	useEffect(() => {
		if (!programId || !institutionSlug) return;

		convex
			.query(api.program.queries.getById, {
				slug: institutionSlug,
				id: programId,
			})
			.catch((error: unknown) => {
				if (
					error instanceof ConvexError &&
					error.data?.code === "PROGRAM_NOT_FOUND"
				) {
					notFound();
				}
			});
	}, [convex, institutionSlug, programId]);

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Program settings</PageHeaderTitle>
					<PageHeaderDescription>
						Manage details for{" "}
						<i className="text-foreground">{program?.name ?? "this program"}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<div className="mx-auto max-w-3xl space-y-8">
				{program ? (
					<>
						<ProgramGeneralSection
							key={`general-${program._id}-${program.name}-${program.alias}`}
							program={program}
						/>
						<ProgramDangerZoneSection program={program} />
					</>
				) : (
					<ProgramSettingsSkeleton />
				)}
			</div>
		</Container>
	);
}

function ProgramSettingsSkeleton() {
	return (
		<div className="space-y-8">
			{Array.from({ length: 2 }).map((_, sectionIndex) => (
				<div key={sectionIndex} className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-56" />
					<div className="space-y-2 pt-2">
						{Array.from({ length: 2 }).map((_, index) => (
							<Skeleton key={index} className="h-14 w-full rounded-lg" />
						))}
					</div>
				</div>
			))}
		</div>
	);
}
