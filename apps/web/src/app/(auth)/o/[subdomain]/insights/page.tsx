"use client";

import { useParams } from "next/navigation";

export default function Page() {
	const { subdomain } = useParams<{ subdomain: string }>();

	return (
		<main className="h-svh flex items-center justify-center">
			Insights of {subdomain}
		</main>
	);
}
