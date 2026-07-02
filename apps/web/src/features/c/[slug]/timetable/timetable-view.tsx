"use client";

import { api } from "@instello/convex/api";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { UpcomingFeaturePreview } from "@/components/common/upcoming-feature-preview/upcoming-feature-preview";
import { useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import {
	getFeaturePreview,
	getFeaturePreviewTitle,
} from "@/lib/feature-previews";

export function TimetableView() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const cls = useInsQuery(
		api.classes.getBySlug,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);
	const preview = getFeaturePreview("timetable", "class");

	return (
		<Container className="flex min-h-0 flex-1 flex-col">
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Timetables</PageHeaderTitle>
					<PageHeaderDescription>
						Manage timetables for{" "}
						<i className="text-foreground">{cls?.name ?? "this class"}</i> in{" "}
						<i className="text-foreground">{program?.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<UpcomingFeaturePreview
				featureKey="timetable"
				featureTitle={getFeaturePreviewTitle("timetable")}
				scope="class"
				slides={preview.slides}
			/>
		</Container>
	);
}
