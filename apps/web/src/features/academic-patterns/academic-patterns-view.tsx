"use client";

import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { AcademicPatternsList } from "./academic-patterns-list";

export default function AcademicPatternsView() {
	return (
		<Container>
			<PageHeader className="h-auto flex-col items-start gap-4 sm:flex-row sm:items-center">
				<PageHeaderStart>
					<PageHeaderTitle>Academic Patterns</PageHeaderTitle>
					<PageHeaderDescription>
						Reusable academic calendar templates shared across your
						institutions.
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			<AcademicPatternsList />
		</Container>
	);
}
