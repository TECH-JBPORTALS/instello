"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import { IconPlus } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { Timetable } from "@/components/timetable/timetable-display";
import {
	TimetablePublishInfo,
	type TimetablePublishInfoProps,
} from "@/components/timetable/timetable-publish-info";
import {
	CLASS_TIMETABLE_DUMMY_ITEMS,
	CLASS_TIMETABLE_PUBLISH_INFO,
	CLASS_TIMETABLE_VERSION_HISTORY,
	type TimetableVersionEntry,
} from "@/features/timetable/dummy-timetable-data";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function TimetableView({
	basePath,
	publishInfo: defaultPublishInfo = CLASS_TIMETABLE_PUBLISH_INFO,
	versionHistory = CLASS_TIMETABLE_VERSION_HISTORY,
}: {
	basePath: string;
	publishInfo?: TimetablePublishInfoProps;
	versionHistory?: TimetableVersionEntry[];
}) {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });

	const searchParams = useSearchParams();

	const versionParam = searchParams.get("v");
	const requestedVersion = versionParam ? Number(versionParam) : null;
	const latestVersion = defaultPublishInfo.currentVersion;
	const viewedEntry =
		requestedVersion && requestedVersion !== latestVersion
			? versionHistory.find((entry) => entry.version === requestedVersion)
			: undefined;
	const isLatest = !viewedEntry;
	const publishInfo = viewedEntry
		? {
				publisher: viewedEntry.publisher,
				message: viewedEntry.message,
				publishedAt: viewedEntry.publishedAt,
				currentVersion: viewedEntry.version,
				totalVersions: defaultPublishInfo.totalVersions,
			}
		: defaultPublishInfo;

	return (
		<Container className="relative flex min-h-0 flex-1 flex-col">
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Timetable</PageHeaderTitle>
					<PageHeaderDescription>
						Manage the timetable for{" "}
						<i className="text-foreground">{"this class"}</i> in{" "}
						<i className="text-foreground">{program?.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>

				<PageHeaderEnd>
					<Button>
						<IconPlus /> New version
					</Button>
				</PageHeaderEnd>
			</PageHeader>

			<TimetablePublishInfo
				{...publishInfo}
				historyHref={`${basePath}/versions`}
				isLatest={isLatest}
				latestHref={basePath}
			/>

			<Timetable items={CLASS_TIMETABLE_DUMMY_ITEMS} />
		</Container>
	);
}
