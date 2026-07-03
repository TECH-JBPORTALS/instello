"use client";

import { api } from "@instello/convex/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import { Badge } from "@instello/ui/components/badge";
import { Button } from "@instello/ui/components/button";
import {
	IconCheck,
	IconChevronLeft,
	IconCopy,
	IconTag,
	IconUser,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import Container from "@/components/common/container";
import { PageHeader, PageHeaderStart } from "@/components/common/page-header";
import {
	CLASS_TIMETABLE_VERSION_HISTORY,
	type TimetableVersionEntry,
} from "@/features/timetable/dummy-timetable-data";
import { useInsQuery } from "@/hooks/convex-react";
import { useProgramAlias } from "@/hooks/use-program-alias";

export function TimetableHistoryView({
	basePath,
	versionHistory = CLASS_TIMETABLE_VERSION_HISTORY,
}: {
	basePath: string;
	versionHistory?: TimetableVersionEntry[];
}) {
	const programAlias = useProgramAlias();
	const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });

	const latestVersion = versionHistory[0]?.version;

	return (
		<Container className="flex min-h-0 flex-1 flex-col">
			<PageHeader className="h-fit">
				<PageHeaderStart>
					<Button
						nativeButton={false}
						variant="ghost"
						size="sm"
						className="-ml-2 h-8 rounded-full px-2 text-muted-foreground"
						render={<Link href={basePath} />}
					>
						<IconChevronLeft className="size-4" />
						Timetable
					</Button>
				</PageHeaderStart>
			</PageHeader>

			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Timetable Versions
				</h1>
				<p className="text-sm text-muted-foreground">
					Version history for <i className="text-foreground">{"this class"}</i>{" "}
					in <i className="text-foreground">{program?.name}</i>
				</p>
			</div>

			<ol className="relative ml-3 space-y-6 border-l pl-8">
				{versionHistory.map((entry) => (
					<VersionHistoryItem
						key={entry.version}
						entry={entry}
						isLatest={entry.version === latestVersion}
						timetablePath={basePath}
					/>
				))}
			</ol>
		</Container>
	);
}

function VersionHistoryItem({
	entry,
	isLatest,
	timetablePath,
}: {
	entry: TimetableVersionEntry;
	isLatest: boolean;
	timetablePath: string;
}) {
	const [copied, setCopied] = useState(false);
	const viewHref = `${timetablePath}?v=${entry.version}`;

	async function handleCopy() {
		await navigator.clipboard.writeText(`${window.location.origin}${viewHref}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<li className="relative">
			<span
				className={
					"absolute top-1 -left-[calc(2rem+5px)] size-2.5 rounded-full bg-border ring-4 ring-background"
				}
			/>
			<div className="flex items-center justify-between gap-4 rounded-lg border p-4">
				<div className="min-w-0 flex-1 space-y-1.5">
					<Link
						href={viewHref}
						className="truncate text-sm font-medium text-foreground hover:underline"
					>
						{entry.message}
					</Link>
					<div className="flex items-center gap-1.5">
						<Avatar size="sm">
							{entry.publisher.image ? (
								<AvatarImage
									src={entry.publisher.image}
									alt={entry.publisher.name}
								/>
							) : null}
							<AvatarFallback>
								<IconUser className="size-3" />
							</AvatarFallback>
						</Avatar>
						<span className="text-xs text-muted-foreground">
							{entry.publisher.name} published{" "}
							{formatDistanceToNow(entry.publishedAt, { addSuffix: true })}
						</span>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<Badge variant="outline" className="gap-1">
						<IconTag className="size-3" />v{entry.version}
					</Badge>
					{isLatest && <Badge>Latest</Badge>}
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={handleCopy}
						aria-label={copied ? "Copied" : "Copy link to this version"}
					>
						{copied ? <IconCheck /> : <IconCopy />}
					</Button>
				</div>
			</div>
		</li>
	);
}
