import { api } from "@instello/convex/api";
import { fetchAuthQuery } from "@instello/convex/better-auth/server";
import { redirect } from "next/navigation";

export default async function Page() {
	const { redirectUrl } = await fetchAuthQuery(api.users.resolveLandingPath);

	redirect(redirectUrl);
}
