import { api } from "@instello/convex/api";
import { fetchAuthQuery } from "@instello/convex/better-auth/server";
import { notFound, redirect } from "next/navigation";
import { ProgramsListPage } from "@/features/programs/pages/programs-list-page";
import { programPath } from "@/features/programs/program-path";

export default async function Page({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}) {
	const { subdomain } = await params;
	const user = await fetchAuthQuery(api.users.getCurrentUserInInstitution, {
		slug: subdomain,
	});

	if (user.role === "faculty" && user.isHeadOfProgram && user.hopProgram) {
		redirect(programPath(user.hopProgram.alias, "classes"));
	}

	if (user.role === "faculty") {
		return notFound();
	}

	return <ProgramsListPage />;
}
