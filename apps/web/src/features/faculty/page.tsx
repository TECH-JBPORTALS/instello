"use client";

import { authClient } from "@instello/convex/better-auth/client";
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
import { AddFacultyButton } from "./add-faculty-button";
import type { FacultyStatusTab } from "./constants";
import { useCanManageFaculty } from "./hooks/use-can-manage-faculty";
import { FacultyStatusTabs, FacultyTable } from "./tables/faculty-table";

export function FacultyPage() {
	const { data: activeOrg } = authClient.useActiveOrganization();
	const canManage = useCanManageFaculty();
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
						All faculty members under {activeOrg?.name ?? "your institution"}
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
					<AddFacultyButton disabled={!canManage} />
				</PageHeaderEnd>
			</PageHeader>

			<FacultyStatusTabs value={statusTab} onChange={setStatusTab} />

			<FacultyTable status={statusTab} searchQuery={searchQuery} />
		</Container>
	);
}
