"use client";

import { Button } from "@instello/ui/components/button";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import Container from "@/components/common/container";
import { PageHeader, PageHeaderStart } from "@/components/common/page-header";
import { programPath } from "@/features/programs/program-path";
import { ClassTimetablePage } from "@/features/timetable/pages/class-timetable-page";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function ProgramClassTimetablePage() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();

	return (
		<>
			<Container className="pb-0">
				<PageHeader className="h-fit">
					<PageHeaderStart>
						<Button
							nativeButton={false}
							render={<Link href={programPath(programAlias, `timetables`)} />}
							variant={"ghost"}
							className={"rounded-full text-muted-foreground -mx-3.5"}
						>
							<IconArrowLeft /> Program Timetables
						</Button>
					</PageHeaderStart>
				</PageHeader>
			</Container>

			<ClassTimetablePage
				basePath={programPath(programAlias, `timetables/${classSlug}`)}
			/>
		</>
	);
}
