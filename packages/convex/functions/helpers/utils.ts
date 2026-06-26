import { ConvexError } from "convex/values";

export function formInstitutionUrl(slug: string) {
	const siteUrl = process.env.SITE_URL;

	if (!siteUrl) {
		throw new ConvexError("SITE_URL not set in the convex dashboard");
	}

	const url = new URL(siteUrl);

	const parts = url.hostname.split(".");

	parts[0] = slug; // Replace the first subdomain

	url.hostname = parts.join(".");

	return url.toString();
}
