import { api } from "@instello/convex/api";
import { fetchAuthQuery } from "@instello/convex/better-auth/server";
import { redirect } from "next/navigation";
import { protocol, rootDomain } from "@/lib/utils";

export default async function Page() {
	const resource = await fetchAuthQuery(api.auth.getUserResource);

	if (resource?.resourceSlug) {
		if (resource.role === "owner") redirect(`/${resource.resourceSlug}`);
		else redirect(`${protocol}${resource.resourceSlug}.${rootDomain}`);
	}

	return null;
}
