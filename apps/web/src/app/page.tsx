"use client";

import { Button } from "@instello/ui/components/button";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";

export default function Home() {
	const programs = useQuery(api.programs.list);
	return (
		<main className="flex flex-col gap-3 items-center justify-center h-svh text-2xl font-bold">
			Welcome to Instello{" "}
			<Button size={"lg"}>
				<PlusIcon /> Create
			</Button>
			{programs?.map((p) => (
				<span key={p._id}>{p.title}</span>
			))}
		</main>
	);
}
