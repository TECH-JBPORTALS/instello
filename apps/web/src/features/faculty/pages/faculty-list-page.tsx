"use client";

import { api } from "@instello/convex/api";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { AddFacultyButton } from "../components/add-faculty-button";
import { FacultyList } from "../components/faculty-list";
import { FacultyStatusTabs } from "../components/faculty-status-tabs";
import type { FacultyStatusTab } from "../constants";

export function FacultyListPage() {
	const slug = useInstitutionSlug();
	const institution = useInsQuery(api.institution.queries.getBySlug, { slug });
	const [statusTab, setStatusTab] = useState<FacultyStatusTab>("active");
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<Container>
			<PageHeader className="h-auto flex-col items-start gap-4 sm:flex-row sm:items-center">
				<PageHeaderStart>
					<PageHeaderTitle className="text-2xl">
						Faculty members
					</PageHeaderTitle>
					<PageHeaderDescription>
						All faculty members under{" "}
						<i className="text-foreground">{institution?.name}</i>
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
					<AddFacultyButton />
				</PageHeaderEnd>
			</PageHeader>

			<FacultyStatusTabs value={statusTab} onChange={setStatusTab} />

			<FacultyList status={statusTab} searchQuery={searchQuery} />
		</Container>
	);
}
