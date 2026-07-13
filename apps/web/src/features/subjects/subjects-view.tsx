"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { NewSubjectDialog } from "./new-subject-dialog";
import { SubjectsList } from "./subjects-list";

export default function SubjectsView() {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const institutionSlug = useInstitutionSlug();
	const institution = useInsQuery(api.institution.queries.getBySlug, {
		slug: institutionSlug,
	});

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 300);

		return () => clearTimeout(timeout);
	}, [searchQuery]);

	return (
		<Container>
			<PageHeader className="h-auto flex-col items-start gap-4 sm:flex-row sm:items-center">
				<PageHeaderStart>
					<PageHeaderTitle>Subjects</PageHeaderTitle>
					<PageHeaderDescription>
						Manage all subjects under{" "}
						<i className="text-foreground">
							{institution?.name ?? institutionSlug}
						</i>
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

			<SubjectsList searchQuery={debouncedSearch} />

			<NewSubjectDialog open={open} setOpen={setOpen} />
		</Container>
	);
}
