"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { isUndefined } from "lodash";
import { useEffect, useState } from "react";
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
import { ClassesList } from "./classes-list";
import { NewClassDialog } from "./new-class-dialog";

export default function ClassesView() {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 300);

		return () => clearTimeout(timeout);
	}, [searchQuery]);

	if (isUndefined(program)) {
		return (
			<Container>
				<Skeleton className="mb-4 h-10 w-48" />
				<Skeleton className="h-72 w-full" />
			</Container>
		);
	}

	return (
		<Container>
			<PageHeader className="h-auto flex-col items-start gap-4 sm:flex-row sm:items-center">
				<PageHeaderStart>
					<PageHeaderTitle>Classes</PageHeaderTitle>
					<PageHeaderDescription>
						Manage classes for <i className="text-foreground">{program.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>

				<PageHeaderEnd className="w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
					<InputGroup className="w-full sm:w-64">
						<InputGroupAddon>
							<IconSearch />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Search..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</InputGroup>
					<Button onClick={() => setOpen(true)}>
						<IconPlus />
						Add
					</Button>
				</PageHeaderEnd>
			</PageHeader>

			<ClassesList searchQuery={debouncedSearch} programId={program._id} />

			<NewClassDialog
				open={open}
				setOpen={setOpen}
				programId={program._id}
				programAlias={programAlias}
			/>
		</Container>
	);
}
