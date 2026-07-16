"use client";

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import { IconCalendarCheck } from "@tabler/icons-react";
import { notFound } from "next/navigation";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useAssignedSubjectKey } from "../hooks/use-assigned-subject-key";

export function AssignedSubjectPage() {
	const key = useAssignedSubjectKey();

	if (!key) {
		notFound();
	}

	const title = key.subjectAlias.replace(/-/g, " ");

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle className="capitalize">{title}</PageHeaderTitle>
					<PageHeaderDescription>
						Assigned subject workspace for this class. Attendance tools will
						appear here soon.
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<Empty className="border border-border min-h-72 border-dashed">
				<EmptyMedia variant="icon">
					<IconCalendarCheck />
				</EmptyMedia>
				<EmptyHeader>
					<EmptyTitle>Nothing here yet</EmptyTitle>
					<EmptyDescription>
						Attendance for this class subject will show up on this page.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</Container>
	);
}
