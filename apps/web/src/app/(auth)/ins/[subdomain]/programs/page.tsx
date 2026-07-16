import { api } from "@instello/convex/api";
import { fetchAuthQuery } from "@instello/convex/better-auth/server";
import { notFound } from "next/navigation";
import { ProgramsListPage } from "@/features/programs/pages/programs-list-page";

export default async function Page({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}) {
	const { subdomain } = await params;
	const user = await fetchAuthQuery(api.users.getCurrentUserInInstitution, {
		slug: subdomain,
	});

	if (user.role === "faculty") {
		return notFound();
	}
	return <ProgramsListPage />;
}
