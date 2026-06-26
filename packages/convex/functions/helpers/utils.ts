import { env } from "../_generated/server";

export function formInstitutionUrl(slug: string) {
	const siteUrl = env.SITE_URL;

	const url = new URL(siteUrl);

	const parts = url.hostname.split(".");

	parts[0] = slug; // Replace the first subdomain

	url.hostname = parts.join(".");

	return url.toString();
}
