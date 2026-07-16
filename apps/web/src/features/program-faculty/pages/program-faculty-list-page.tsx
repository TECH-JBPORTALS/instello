"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconPlus } from "@tabler/icons-react";
import { isUndefined } from "lodash";
import { useState } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { AssignFacultyDialog } from "../components/assign-faculty-dialog";
import { ProgramFacultyList } from "../components/program-faculty-list";

export function ProgramFacultyListPage() {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});
	const [assignOpen, setAssignOpen] = useState(false);

	if (isUndefined(program)) {
		return (
			<Container>
				<Skeleton className="mb-4 h-8 w-64" />
				<Skeleton className="h-72 w-full" />
			</Container>
		);
	}

	return (
		<Container>
			<PageHeader className="h-auto flex-col items-start gap-4 py-4 sm:flex-row sm:items-center">
				<PageHeaderStart>
					<PageHeaderTitle>Faculty</PageHeaderTitle>
					<PageHeaderDescription>
						Staff assigned to <i className="text-foreground">{program.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
				<PageHeaderEnd>
					<Button onClick={() => setAssignOpen(true)}>
						<IconPlus />
						Assign staff
					</Button>
				</PageHeaderEnd>
			</PageHeader>

			<ProgramFacultyList
				programId={program._id}
				onAssign={() => setAssignOpen(true)}
			/>

			<AssignFacultyDialog
				open={assignOpen}
				onOpenChange={setAssignOpen}
				programId={program._id}
			/>
		</Container>
	);
}
