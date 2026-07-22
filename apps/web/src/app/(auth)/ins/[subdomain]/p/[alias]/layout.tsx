import { api } from "@instello/convex/api";
import { fetchAuthQuery } from "@instello/convex/better-auth/server";
import { notFound } from "next/navigation";

export default async function Layout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ subdomain: string }>;
}) {
	const { subdomain } = await params;
	const user = await fetchAuthQuery(api.users.getCurrentUserInInstitution, {
		slug: subdomain,
	});

	if (user.role === "faculty" && !user.isHeadOfProgram) {
		return notFound();
	}

	return <>{children}</>;
}
