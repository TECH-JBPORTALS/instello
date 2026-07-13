import { Button } from "@instello/ui/components/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { InstitutionsList } from "../components/institutions-list";

export function InstitutionsListPage() {
	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>My Institutions</PageHeaderTitle>
					<PageHeaderDescription>
						Manage all you institutions under one roof.
					</PageHeaderDescription>
				</PageHeaderStart>

				<PageHeaderEnd>
					<Button nativeButton={false} render={<Link href={`/new`} />}>
						<IconPlus />
						Create
					</Button>
				</PageHeaderEnd>
			</PageHeader>

			<InstitutionsList />
		</Container>
	);
}
