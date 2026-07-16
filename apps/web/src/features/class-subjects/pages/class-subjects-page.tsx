"use client";

import { api } from "@instello/convex/api";
import { useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { notFound } from "next/navigation";
import { useEffect } from "react";
import Container from "@/components/common/container";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderStart,
	PageHeaderTitle,
} from "@/components/common/page-header";
import { ClassSubjectList } from "@/features/class-subjects/components/class-subject-list";
import { useInsQuery, useInstitutionSlug } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function ClassSubjectsPage() {
	const convex = useConvex();
	const institutionSlug = useInstitutionSlug();
	const programAlias = useProgramAlias();
	const classSlug = useClassSlug();
	const program = useInsQuery(api.program.queries.getByAlias, {
		alias: programAlias,
	});
	const cls = useInsQuery(
		api.class.queries.getBySlug,
		program && classSlug ? { programId: program._id, classSlug } : "skip",
	);

	useEffect(() => {
		if (!programAlias || !classSlug || !institutionSlug || !program) return;

		convex
			.query(api.class.queries.getBySlug, {
				slug: institutionSlug,
				programId: program._id,
				classSlug,
			})
			.catch((error: unknown) => {
				if (
					error instanceof ConvexError &&
					error.data?.code === "CLASS_NOT_FOUND"
				) {
					notFound();
				}
			});
	}, [classSlug, convex, institutionSlug, program, programAlias]);

	const stageName = cls?.currentHeadStage?.name ?? "this stage";

	return (
		<Container>
			<PageHeader>
				<PageHeaderStart>
					<PageHeaderTitle>Subjects</PageHeaderTitle>
					<PageHeaderDescription>
						Assign faculty to subjects for{" "}
						<i className="text-foreground">{cls?.name ?? "this class"}</i> in{" "}
						<i className="text-foreground">{program?.name}</i>
						{cls?.currentHeadStage ? (
							<>
								{" "}
								(<i className="text-foreground">{cls.currentHeadStage.name}</i>)
							</>
						) : null}
					</PageHeaderDescription>
				</PageHeaderStart>
			</PageHeader>

			{cls ? (
				<ClassSubjectList classId={cls._id} stageName={stageName} />
			) : null}
		</Container>
	);
}
