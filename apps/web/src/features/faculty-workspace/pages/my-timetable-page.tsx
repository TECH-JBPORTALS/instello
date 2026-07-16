"use client";

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import { IconCalendarWeek } from "@tabler/icons-react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";

export function MyTimetablePage() {
	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>My Timetable</PageHeaderTitle>
					<PageHeaderDescription>
						Your scheduled classes and teaching hours.
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<Empty className="min-h-72 border border-dashed border-border">
				<EmptyMedia variant="icon">
					<IconCalendarWeek />
				</EmptyMedia>
				<EmptyHeader>
					<EmptyTitle>No timetable yet</EmptyTitle>
					<EmptyDescription>
						Your teaching schedule will appear here once it is assigned.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</Container>
	);
}
