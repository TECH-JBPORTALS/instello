"use client";

import { api } from "@instello/convex/api";
import { useEffect } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderEnd,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { useInsMutation, useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { AddStudentButton } from "./add-student-button";
import { StudentsList } from "./students-list";

export function StudentsView() {
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
	const cls = useInsQuery(
		api.classes.getBySlug,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);
	const ensureCategories = useInsMutation(api.students.ensureCategories);

	useEffect(() => {
		void ensureCategories({});
	}, [ensureCategories]);

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Students</PageHeaderTitle>
					<PageHeaderDescription>
						Manage students for{" "}
						<i className="text-foreground">{cls?.name ?? "this class"}</i> in{" "}
						<i className="text-foreground">{program?.name}</i>
					</PageHeaderDescription>
				</PageHeaderStart>
				{cls && (
					<PageHeaderEnd>
						<AddStudentButton classId={cls._id} />
					</PageHeaderEnd>
				)}
			</PageHeader>

			{cls && <StudentsList classId={cls._id} />}
		</Container>
	);
}
