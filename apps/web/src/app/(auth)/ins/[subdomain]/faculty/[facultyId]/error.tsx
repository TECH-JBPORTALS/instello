"use client";

import { Button } from "@instello/ui/components/button";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import Container from "@/components/common/container";

export default function FacultyDetailError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<Container>
			<div className="space-y-4">
				<Button
					nativeButton={false}
					variant="ghost"
					render={<Link href="/faculty" />}
				>
					<IconArrowLeft />
					Back to faculty
				</Button>
				<div className="space-y-2">
					<h1 className="text-lg font-semibold">Faculty member not found</h1>
					<p className="text-sm text-muted-foreground">
						{error.message || "This faculty member could not be loaded."}
					</p>
					<Button variant="outline" onClick={reset}>
						Try again
					</Button>
				</div>
			</div>
		</Container>
	);
}
