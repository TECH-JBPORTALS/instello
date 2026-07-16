"use client";

import { Button } from "@instello/ui/components/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import { IconArrowLeft } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/common/container";
import { protocol, rootDomain } from "@/lib/utils";

export default function Page() {
	const { subdomain } = useParams<{ subdomain?: string }>();

	return (
		<Container className="h-svh flex items-center justify-center">
			<Empty>
				<EmptyMedia>
					<Image src={"/404.svg"} alt="404" width={200} height={200} />
				</EmptyMedia>
				<EmptyHeader>
					<EmptyTitle>Page not found</EmptyTitle>
					<EmptyDescription>
						The page you are looking for does not exist. May be you don't have
						access to this page.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button
						variant={"secondary"}
						size={"lg"}
						className={"rounded-full"}
						render={
							<Link
								href={`${protocol}://${subdomain ?? "app"}.${rootDomain}`}
							/>
						}
						nativeButton={false}
					>
						<IconArrowLeft />
						Back to home
					</Button>
				</EmptyContent>
			</Empty>
		</Container>
	);
}
