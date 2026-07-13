"use client";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@instello/ui/components/input-group";
import { IconSearch } from "@tabler/icons-react";
import { parseAsString, useQueryState } from "nuqs";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";

export function AttendancePageHeader() {
	const [searchQuery, setSearchQuery] = useQueryState(
		"q",
		parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
	);

	return (
		<PageHeader className="h-auto flex-col items-start gap-4 sm:h-14 sm:flex-row sm:items-center">
			<PageHeaderStart>
				<PageHeaderTitle>Attendance Registers</PageHeaderTitle>
				<PageHeaderDescription>
					Manage attendance registers for this class
				</PageHeaderDescription>
			</PageHeaderStart>

			<PageHeaderEnd className="w-full sm:w-auto">
				<InputGroup className="w-full sm:w-64">
					<InputGroupAddon>
						<IconSearch />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Search registers..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</InputGroup>
			</PageHeaderEnd>
		</PageHeader>
	);
}
