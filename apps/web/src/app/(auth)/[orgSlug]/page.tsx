"use client";

import { authClient } from "@instello/convex/better-auth/client";
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
	const canCreate = authClient.organization.checkRolePermission({
		role: "owner",
		permissions: { program: ["create"] },
	});

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
					{canCreate && (
						<Button>
							<IconPlus />
							Create
						</Button>
					)}
				</PageHeaderEnd>
			</PageHeader>

			<InstitutionsList />
		</Container>
	);
}
