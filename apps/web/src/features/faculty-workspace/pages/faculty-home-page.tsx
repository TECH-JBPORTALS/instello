"use client";

import { api } from "@instello/convex/api";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsQuery } from "@/hooks/convex-react";

export function FacultyHomePage() {
	const user = useInsQuery(api.users.getCurrentUserInInstitution);

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>
						{user ? `Welcome, ${user.name.split(" ")[0]}` : "Home"}
					</PageHeaderTitle>
					<PageHeaderDescription>
						Your teaching workspace for today.
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>
		</Container>
	);
}
