"use client";

import { Button } from "@instello/ui/components/button";
import { PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";

export default function Home() {
	const params = useParams<{ subdomain: string }>();

	return (
		<main className="flex flex-col gap-3 items-center justify-center h-svh text-2xl font-bold">
			Welcome to {params.subdomain}{" "}
			<Button size={"lg"}>
				<PlusIcon /> Create
			</Button>
		</main>
	);
}
