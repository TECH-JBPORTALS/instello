import { api } from "@instello/convex/api";
import { fetchAuthQuery } from "@instello/convex/better-auth/server";
import { redirect } from "next/navigation";
import { FacultyHomePage } from "@/features/faculty-workspace/pages/faculty-home-page";

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
		return <FacultyHomePage />;
	}

	redirect("/programs");
}
