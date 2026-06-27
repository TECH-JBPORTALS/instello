"use client";

import { Button } from "@instello/ui/components/button";
import { IconPlus } from "@tabler/icons-react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { InstitutionsList } from "@/components/institution/institutions-list";

export default function Home() {
	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>My Institutions</PageHeaderTitle>
					<PageHeaderDescription>
						Manage all institutions institutions under one roof.
					</PageHeaderDescription>
				</PageHeaderStart>

				<PageHeaderEnd>
					<Button>
						<IconPlus />
						Create
					</Button>
				</PageHeaderEnd>
			</PageHeader>

			<InstitutionsList />
		</Container>
	);
}
