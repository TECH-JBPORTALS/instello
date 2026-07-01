"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache";
import { useState } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInstitutionSlug } from "@/hooks/convex-react";
import { NewProgramDialog } from "./new-program-dialog";
import { ProgramsList } from "./programs-list";

export default function Programs() {
	const [open, setOpen] = useState(false);
	const institutionSlug = useInstitutionSlug();
	const institution = useQuery(api.institutions.getBySlug, {
		slug: institutionSlug,
	});

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Programs</PageHeaderTitle>
					<PageHeaderDescription>
						Manage all programs under{" "}
						<i className="text-foreground">
							{institution?.name ?? institutionSlug}
						</i>
					</PageHeaderDescription>
				</PageHeaderStart>

				<PageHeaderEnd>
					<Button onClick={() => setOpen(true)}>
						<IconPlus />
						Add
					</Button>
				</PageHeaderEnd>
			</PageHeader>

			<ProgramsList />

			<NewProgramDialog open={open} setOpen={setOpen} />
		</Container>
	);
}
