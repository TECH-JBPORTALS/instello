"use client";

import { api } from "@instello/convex/api";
import { Skeleton } from "@instello/ui/components/skeleton";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { BatchesSettingsSection } from "./sections/batches-settings-section";
import { GeneralSettingsSection } from "./sections/general-settings-section";

export function ClassSettingsView() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const cls = useInsQuery(
		api.classes.getBySlug,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Class settings</PageHeaderTitle>
					<PageHeaderDescription>
						Manage general details and batches for{" "}
						<i className="text-foreground">{cls?.name ?? "this class"}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<div className="mx-auto max-w-3xl space-y-8">
				{cls ? (
					<>
						<GeneralSettingsSection
							key={`general-${cls._id}-${cls.updatedAt}`}
							cls={cls}
						/>
						<BatchesSettingsSection
							key={`batches-${cls._id}-${cls.updatedAt}`}
							cls={cls}
						/>
					</>
				) : (
					<ClassSettingsSkeleton />
				)}
			</div>
		</Container>
	);
}

function ClassSettingsSkeleton() {
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
