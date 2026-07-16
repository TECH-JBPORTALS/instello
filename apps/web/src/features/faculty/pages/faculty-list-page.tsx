"use client";

import { api } from "@instello/convex/api";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@instello/ui/components/select";
import { IconFilter, IconSearch } from "@tabler/icons-react";
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
import {
	FACULTY_STATUS_FILTER_LABELS,
	FACULTY_STATUS_FILTERS,
	type FacultyStatusFilter,
} from "../constants";

export function FacultyListPage() {
	const slug = useInstitutionSlug();
	const institution = useInsQuery(api.institution.queries.getBySlug, { slug });
	const [statusFilter, setStatusFilter] = useState<FacultyStatusFilter>("all");
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
					<Select
						value={statusFilter}
						onValueChange={(value) => {
							if (
								value &&
								FACULTY_STATUS_FILTERS.includes(value as FacultyStatusFilter)
							) {
								setStatusFilter(value as FacultyStatusFilter);
							}
						}}
					>
						<SelectTrigger size="sm" className="w-full sm:min-w-40">
							<IconFilter className="size-4 text-muted-foreground" />
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							{FACULTY_STATUS_FILTERS.map((status) => (
								<SelectItem key={status} value={status}>
									{FACULTY_STATUS_FILTER_LABELS[status]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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

			<FacultyList statusFilter={statusFilter} searchQuery={searchQuery} />
		</Container>
	);
}
