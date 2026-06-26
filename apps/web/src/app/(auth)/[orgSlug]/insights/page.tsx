"use client";

import { useParams } from "next/navigation";

export default function Page() {
	const { orgSlug } = useParams<{ orgSlug: string }>();

	return (
		<main className="h-svh flex items-center justify-center">
			Insights of {orgSlug}
		</main>
	);
}
